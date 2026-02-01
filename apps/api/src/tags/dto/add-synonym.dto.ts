import { IsString, MinLength, MaxLength } from 'class-validator';

export class AddSynonymDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  synonymName: string;
}
