import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { CoursesService } from '../courses/courses.service';
import { TopicsService } from '../topics/topics.service';
import { UsersService } from '../users/users.service';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { QueryStudySessionsDto } from './dto/query-study-sessions.dto';
import { StudySession, StudySessionDocument } from './schemas/study-session.schema';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectModel(StudySession.name) private readonly studySessionModel: Model<StudySessionDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @Inject(forwardRef(() => CoursesService)) private readonly coursesService: CoursesService,
    @Inject(forwardRef(() => TopicsService)) private readonly topicsService: TopicsService,
    private readonly usersService: UsersService
  ) {}

  async create(userId: string, payload: CreateStudySessionDto) {
    await this.coursesService.assertOwned(userId, payload.courseId);
    if (payload.topicId) {
      await this.topicsService.assertOwned(userId, payload.topicId);
    }
    const session = await this.studySessionModel.create({
      ...payload,
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(payload.courseId),
      topicId: payload.topicId ? new Types.ObjectId(payload.topicId) : undefined,
      startedAt: new Date(payload.startedAt),
      endedAt: new Date(payload.endedAt)
    });
    return this.map(session.toObject());
  }

  async list(userId: string, query: QueryStudySessionsDto) {
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (query.courseId) filter.courseId = query.courseId;
    if (query.topicId) filter.topicId = query.topicId;
    if (query.mode) filter.mode = query.mode;
    if (query.from || query.to) {
      filter.startedAt = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {})
      };
    }
    const page = query.page ?? 1;
    const pageSize = 20;
    const [items, total] = await Promise.all([
      this.studySessionModel.find(filter).sort({ startedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
      this.studySessionModel.countDocuments(filter).exec()
    ]);
    return { items: items.map((item) => this.map(item)), total };
  }

  async stats(userId: string) {
    const sessions = await this.studySessionModel.find({ userId: new Types.ObjectId(userId) }).lean().exec();
    const pomodoroStats = await this.usersService.getPomodoroStats(userId);
    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekStart = new Date(dayStart);
    weekStart.setUTCDate(dayStart.getUTCDate() - dayStart.getUTCDay());
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const totalMinutes = Math.round(sessions.reduce((sum, session) => sum + session.durationSec / 60, 0));
    const countMinutesSince = (date: Date) => Math.round(sessions.filter((session) => new Date(session.startedAt) >= date).reduce((sum, session) => sum + session.durationSec / 60, 0));
    const byCourseMap = new Map<string, number>();
    const byDayMap = new Map<string, number>();
    const dayKeys = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(dayStart);
      day.setUTCDate(dayStart.getUTCDate() - (6 - index));
      return day.toISOString().slice(0, 10);
    });
    for (const session of sessions) {
      const key = session.courseId.toString();
      byCourseMap.set(key, (byCourseMap.get(key) ?? 0) + Math.round(session.durationSec / 60));
      const dayKey = new Date(session.startedAt).toISOString().slice(0, 10);
      if (dayKeys.includes(dayKey)) {
        byDayMap.set(dayKey, (byDayMap.get(dayKey) ?? 0) + Math.round(session.durationSec / 60));
      }
    }
    const courseIds = Array.from(byCourseMap.keys()).map((courseId) => new Types.ObjectId(courseId));
    const courses = courseIds.length
      ? await this.courseModel.find({ _id: { $in: courseIds }, userId: new Types.ObjectId(userId), status: 'active' }).select('title').lean().exec()
      : [];
    const courseTitles = new Map(courses.map((course) => [course._id.toString(), course.title]));
    const completionRate = pomodoroStats.attemptedCount
      ? Number((pomodoroStats.completedCount / pomodoroStats.attemptedCount).toFixed(2))
      : 0;
    return {
      totalMinutes,
      totalSessions: sessions.length,
      todayMinutes: countMinutesSince(dayStart),
      weekMinutes: countMinutesSince(weekStart),
      monthMinutes: countMinutesSince(monthStart),
      completionRate,
      attemptedPomodoros: pomodoroStats.attemptedCount,
      completedPomodoros: pomodoroStats.completedCount,
      byDay: dayKeys.map((date) => {
        const minutes = byDayMap.get(date) ?? 0;
        return { date, minutes, hours: Number((minutes / 60).toFixed(2)) };
      }),
      byCourse: Array.from(byCourseMap.entries())
        .filter(([courseId]) => courseTitles.has(courseId))
        .map(([courseId, minutes]) => ({ courseId, title: courseTitles.get(courseId)!, minutes }))
        .sort((left, right) => right.minutes - left.minutes)
    };
  }

  async completedMinutesForCourse(userId: string, courseId: string) {
    const result = await this.studySessionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), courseId: new Types.ObjectId(courseId), mode: { $in: ['focus', 'manual'] } } },
      { $group: { _id: null, total: { $sum: '$durationSec' } } }
    ]);
    return Math.round((result[0]?.total ?? 0) / 60);
  }

  async completedMinutesForTopic(userId: string, courseId: string, topicId: string) {
    const result = await this.studySessionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), courseId: new Types.ObjectId(courseId), topicId: new Types.ObjectId(topicId), mode: { $in: ['focus', 'manual'] } } },
      { $group: { _id: null, total: { $sum: '$durationSec' } } }
    ]);
    return Math.round((result[0]?.total ?? 0) / 60);
  }

  private map(session: any) {
    return {
      id: session._id.toString(),
      courseId: session.courseId.toString(),
      topicId: session.topicId?.toString() ?? null,
      mode: session.mode,
      startedAt: new Date(session.startedAt).toISOString(),
      endedAt: new Date(session.endedAt).toISOString(),
      durationSec: session.durationSec,
      notes: session.notes ?? null
    };
  }
}
