import { IsString, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { TagType } from '@prisma/client';

export class CreateTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  canonicalName: string;

  @IsEnum(TagType)
  type: TagType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
