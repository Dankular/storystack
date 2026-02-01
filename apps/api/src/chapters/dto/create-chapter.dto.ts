import { IsString, IsOptional, MaxLength, MinLength, IsBoolean, IsDateString } from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

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
  scheduledPublishAt?: string;
}
