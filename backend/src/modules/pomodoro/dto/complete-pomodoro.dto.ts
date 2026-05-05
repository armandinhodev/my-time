import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CompletePomodoroDto {
  @IsMongoId()
  courseId!: string;

  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @IsEnum(['focus', 'shortBreak', 'longBreak'])
  mode!: 'focus' | 'shortBreak' | 'longBreak';

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
