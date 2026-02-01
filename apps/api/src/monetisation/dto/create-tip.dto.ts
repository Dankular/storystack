import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateTipDto {
  @IsString()
  recipientId: string; // AuthorProfile ID or User ID

  @IsInt()
  @Min(100) // Minimum $1 (in cents)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  storyId?: string;
}

export class ConfirmTipDto {
  @IsString()
  paymentIntentId: string;
}
