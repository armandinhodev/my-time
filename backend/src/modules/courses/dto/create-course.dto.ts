import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'archived'])
  status?: 'active' | 'archived';

  @IsOptional()
  @IsString()
  icon?: string;
}
