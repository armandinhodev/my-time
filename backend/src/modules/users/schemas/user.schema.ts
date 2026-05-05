import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

type ActivePomodoroState = {
  courseId: string;
  topicId?: string | null;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  status: 'running' | 'paused';
  startedAt: Date;
  endsAt: Date;
  durationSec: number;
  remainingSec: number;
  pausedAt?: Date | null;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: String, default: null })
  refreshTokenHash?: string | null;

  @Prop({ type: String, default: null })
  refreshFamily?: string | null;

  @Prop({ type: String, default: null })
  name?: string | null;

  @Prop({
    type: {
      courseId: { type: String, required: true },
      topicId: { type: String, default: null },
      mode: { type: String, enum: ['focus', 'shortBreak', 'longBreak'], required: true },
      status: { type: String, enum: ['running', 'paused'], required: true, default: 'running' },
      startedAt: { type: Date, required: true },
      endsAt: { type: Date, required: true },
      durationSec: { type: Number, required: true, min: 1 },
      remainingSec: { type: Number, required: true, min: 0 },
      pausedAt: { type: Date, default: null }
    },
    default: null
  })
  activePomodoro?: ActivePomodoroState | null;

  @Prop({ default: 0, min: 0 })
  pomodoroAttemptedCount!: number;

  @Prop({ default: 0, min: 0 })
  pomodoroCompletedCount!: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
