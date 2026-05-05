import { IsDateString, IsEnum, IsMongoId, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryStudySessionsDto {
  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @IsOptional()
  @IsEnum(['focus', 'shortBreak', 'longBreak', 'manual'])
  mode?: 'focus' | 'shortBreak' | 'longBreak' | 'manual';

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}
