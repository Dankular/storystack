import { IsString, IsOptional, MaxLength, MinLength, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsNumber()
  chapterNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  authorNotesBefore?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  authorNotesAfter?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string | null;
}
