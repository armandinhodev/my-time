import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  title!: string;

  @IsInt()
  @Min(1)
  estimatedMinutes!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
