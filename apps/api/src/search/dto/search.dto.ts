import { IsString, IsOptional, IsInt, IsArray, Min, Max, IsBoolean } from 'class-validator';

export class SearchStoriesDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minWordCount?: number;

  @IsOptional()
  @IsInt()
  maxWordCount?: number;

  @IsOptional()
  minRating?: number;

  @IsOptional()
  @IsArray()
  tagIds?: string[];

  @IsOptional()
  @IsArray()
  excludeTagIds?: string[];

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'popular' | 'views' | 'rating' | 'updated';
}

export class SearchUsersDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchTagsDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  type?: string;
}

export class CreateSavedSearchDto {
  @IsString()
  name: string;

  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsInt()
  minWordCount?: number;

  @IsOptional()
  @IsInt()
  maxWordCount?: number;

  @IsOptional()
  minRating?: number;

  @IsOptional()
  @IsArray()
  tagIds?: string[];

  @IsOptional()
  @IsArray()
  excludeTagIds?: string[];

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsBoolean()
  notifyNewResults?: boolean;
}

export class UpdateSavedSearchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  notifyNewResults?: boolean;
}
