import { IsString, IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';

export class RecordStoryViewDto {
  @IsString()
  storyId: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class RecordChapterViewDto {
  @IsString()
  chapterId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  readingTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scrollDepth?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class UpdateChapterViewDto {
  @IsString()
  viewId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  readingTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scrollDepth?: number;

  @IsOptional()
  completed?: boolean;
}
