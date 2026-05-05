import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StudySessionDocument = HydratedDocument<StudySession>;

@Schema({ timestamps: true })
export class StudySession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Topic' })
  topicId?: Types.ObjectId;

  @Prop({ enum: ['focus', 'shortBreak', 'longBreak', 'manual'], required: true })
  mode!: 'focus' | 'shortBreak' | 'longBreak' | 'manual';

  @Prop({ required: true })
  startedAt!: Date;

  @Prop({ required: true })
  endedAt!: Date;

  @Prop({ required: true, min: 1 })
  durationSec!: number;

  @Prop()
  notes?: string;
}

export const StudySessionSchema = SchemaFactory.createForClass(StudySession);
StudySessionSchema.index({ userId: 1, startedAt: -1 });
StudySessionSchema.index({ courseId: 1, topicId: 1 });
