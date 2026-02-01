import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ContentRating } from '@prisma/client';

export class CreateStoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsEnum(ContentRating)
  rating?: ContentRating;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
