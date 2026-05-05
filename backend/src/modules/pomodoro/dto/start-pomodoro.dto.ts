import { IsEnum, IsInt, IsMongoId, IsOptional, Min } from 'class-validator';

export class StartPomodoroDto {
  @IsMongoId()
  courseId!: string;

  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @IsEnum(['focus', 'shortBreak', 'longBreak'])
  mode!: 'focus' | 'shortBreak' | 'longBreak';

  @IsInt()
  @Min(1)
  durationSec!: number;
}
