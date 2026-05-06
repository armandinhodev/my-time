import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { StudySessionsService } from '../study-sessions/study-sessions.service';
import { TopicsService } from '../topics/topics.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseDocument } from './schemas/course.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @Inject(forwardRef(() => TopicsService)) private readonly topicsService: TopicsService,
    @Inject(forwardRef(() => StudySessionsService)) private readonly studySessionsService: StudySessionsService
  ) {}

  async create(userId: string, payload: CreateCourseDto) {
    const course = await this.courseModel.create({ ...payload, userId: new Types.ObjectId(userId) });
    return this.enrich(course.toObject());
  }

  async list(userId: string) {
    const courses = await this.courseModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean().exec();
    return Promise.all(courses.map((course) => this.enrich(course)));
  }

  async findOne(userId: string, id: string) {
    const course = await this.courseModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).lean().exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.enrich(course);
  }

  async update(userId: string, id: string, payload: UpdateCourseDto) {
    const course = await this.courseModel.findOneAndUpdate({ _id: id, userId: new Types.ObjectId(userId) }, payload, { new: true }).lean().exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.enrich(course);
  }

  async remove(userId: string, id: string) {
    const course = await this.courseModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }
  }

  async assertOwned(userId: string, id: string) {
    const course = await this.courseModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  private async enrich(course: any) {
    const [topics, completedMinutes] = await Promise.all([
      this.topicsService.listOwned(course.userId.toString(), course._id.toString()),
      this.studySessionsService.completedMinutesForCourse(course.userId.toString(), course._id.toString())
    ]);
    const estimatedMinutes = topics.reduce((sum, topic) => sum + topic.estimatedMinutes, 0);
    return {
      id: course._id.toString(),
      title: course.title,
      description: course.description ?? null,
      status: course.status,
      icon: course.icon ?? null,
      totals: {
        completedMinutes,
        estimatedMinutes,
        progressPercent: estimatedMinutes ? Math.min(100, Math.round((completedMinutes / estimatedMinutes) * 100)) : 0,
        topicCount: topics.length
      },
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
  }
}
