import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';

const ContentRatings = ['GENERAL', 'TEEN', 'MATURE', 'EXPLICIT'] as const;
type ContentRating = typeof ContentRatings[number];

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
  @IsIn(ContentRatings)
  rating?: ContentRating;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
