import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsMongoId, IsNumber, ValidateNested } from 'class-validator';

class ReorderItemDto {
  @IsMongoId()
  id!: string;

  @IsNumber()
  order!: number;
}

export class ReorderTopicsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
