import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true })
export class Course {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['active', 'archived'], default: 'active' })
  status!: 'active' | 'archived';

  @Prop({ type: Object, default: { completedMinutes: 0 } })
  totals!: { completedMinutes: number };

  @Prop({ required: false })
  icon?: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.index({ userId: 1, status: 1, createdAt: -1 });
