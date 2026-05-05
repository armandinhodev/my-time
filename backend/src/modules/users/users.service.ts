import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  create(payload: { email: string; passwordHash: string; name?: string }) {
    return this.userModel.create(payload);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async startPomodoro(
    id: string,
    activePomodoro: {
      courseId: string;
      topicId?: string;
      mode: 'focus' | 'shortBreak' | 'longBreak';
      startedAt: Date;
      endsAt: Date;
      durationSec: number;
    }
  ) {
    await this.userModel
      .findByIdAndUpdate(id, {
        $set: { activePomodoro },
        $inc: { pomodoroAttemptedCount: 1 }
      })
      .exec();
  }

  async completePomodoro(id: string) {
    await this.userModel
      .findByIdAndUpdate(id, {
        $set: { activePomodoro: null },
        $inc: { pomodoroCompletedCount: 1 }
      })
      .exec();
  }

  async clearActivePomodoro(id: string) {
    await this.userModel.findByIdAndUpdate(id, { $set: { activePomodoro: null } }).exec();
  }

  async getPomodoroStats(id: string) {
    const user = await this.userModel.findById(id).select('pomodoroAttemptedCount pomodoroCompletedCount').lean().exec();
    return {
      attemptedCount: user?.pomodoroAttemptedCount ?? 0,
      completedCount: user?.pomodoroCompletedCount ?? 0
    };
  }

  async updateRefreshState(id: string, refreshTokenHash: string | null, refreshFamily: string | null) {
    await this.userModel.findByIdAndUpdate(id, { refreshTokenHash, refreshFamily }).exec();
  }
}
