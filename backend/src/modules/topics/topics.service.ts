import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { StudySessionsService } from '../study-sessions/study-sessions.service';
import { CoursesService } from '../courses/courses.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { Topic, TopicDocument } from './schemas/topic.schema';

@Injectable()
export class TopicsService {
  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @Inject(forwardRef(() => CoursesService)) private readonly coursesService: CoursesService,
    @Inject(forwardRef(() => StudySessionsService)) private readonly studySessionsService: StudySessionsService
  ) {}

  async create(userId: string, courseId: string, payload: CreateTopicDto) {
    await this.coursesService.assertOwned(userId, courseId);
    const courseObjectId = new Types.ObjectId(courseId);
    const userObjectId = new Types.ObjectId(userId);
    const currentCount = await this.topicModel.countDocuments({ courseId: courseObjectId, userId: userObjectId, deletedAt: null }).exec();
    const topic = await this.topicModel.create({
      ...payload,
      courseId: courseObjectId,
      userId: userObjectId,
      order: payload.order ?? currentCount,
      deletedAt: null
    });
    return this.enrich(topic.toObject());
  }

  async listOwned(userId: string, courseId: string) {
    const topics = await this.topicModel
      .find({ userId: new Types.ObjectId(userId), courseId: new Types.ObjectId(courseId), deletedAt: null })
      .sort({ order: 1 })
      .lean()
      .exec();
    return Promise.all(topics.map((topic) => this.enrich(topic)));
  }

  async update(userId: string, id: string, payload: UpdateTopicDto) {
    const topic = await this.topicModel
      .findOneAndUpdate({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId), deletedAt: null }, payload, { new: true })
      .lean()
      .exec();
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }
    return this.enrich(topic);
  }

  async softDelete(userId: string, id: string) {
    const topic = await this.topicModel
      .findOneAndUpdate({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId), deletedAt: null }, { deletedAt: new Date() })
      .exec();
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }
  }

  async reorder(userId: string, courseId: string, payload: ReorderTopicsDto) {
    await this.coursesService.assertOwned(userId, courseId);
    const userObjectId = new Types.ObjectId(userId);
    const courseObjectId = new Types.ObjectId(courseId);
    await Promise.all(
      payload.items.map((item) =>
        this.topicModel
          .updateOne(
            { _id: new Types.ObjectId(item.id), userId: userObjectId, courseId: courseObjectId, deletedAt: null },
            { order: item.order + 1000 }
          )
          .exec()
      )
    );
    await Promise.all(
      payload.items.map((item) =>
        this.topicModel
          .updateOne(
            { _id: new Types.ObjectId(item.id), userId: userObjectId, courseId: courseObjectId, deletedAt: null },
            { order: item.order }
          )
          .exec()
      )
    );
    return this.listOwned(userId, courseId);
  }

  async assertOwned(userId: string, id: string) {
    const topic = await this.topicModel
      .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId), deletedAt: null })
      .exec();
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }
    return topic;
  }

  private async enrich(topic: any) {
    const completedMinutes = await this.studySessionsService.completedMinutesForTopic(topic.userId.toString(), topic.courseId.toString(), topic._id.toString());
    return {
      id: topic._id.toString(),
      courseId: topic.courseId.toString(),
      title: topic.title,
      order: topic.order,
      estimatedMinutes: topic.estimatedMinutes,
      completedMinutes,
      deletedAt: topic.deletedAt
    };
  }
}
