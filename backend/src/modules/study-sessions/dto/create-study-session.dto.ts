import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateStudySessionDto {
  @IsMongoId()
  courseId!: string;

  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @IsEnum(['focus', 'shortBreak', 'longBreak', 'manual'])
  mode!: 'focus' | 'shortBreak' | 'longBreak' | 'manual';

  @IsDateString()
  startedAt!: string;

  @IsDateString()
  endedAt!: string;

  @IsInt()
  @Min(1)
  durationSec!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
