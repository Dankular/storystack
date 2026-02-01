import { IsString, IsOptional, MaxLength } from 'class-validator';

export class AddStoryToListDto {
  @IsString()
  storyId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
