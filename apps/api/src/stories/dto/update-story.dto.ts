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

const StoryStatuses = ['DRAFT', 'ONGOING', 'COMPLETED', 'HIATUS'] as const;
type StoryStatus = typeof StoryStatuses[number];

export class UpdateStoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsIn(StoryStatuses)
  status?: StoryStatus;

  @IsOptional()
  @IsIn(ContentRatings)
  rating?: ContentRating;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
