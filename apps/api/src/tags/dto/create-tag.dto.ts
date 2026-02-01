import { IsString, IsIn, IsOptional, MaxLength, MinLength } from 'class-validator';

const TagTypes = ['GENRE', 'THEME', 'CHARACTER', 'RELATIONSHIP', 'WARNING', 'ADDITIONAL'] as const;
type TagType = typeof TagTypes[number];

export class CreateTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  canonicalName: string;

  @IsIn(TagTypes)
  type: TagType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
