import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class ConnectStripeDto {
  // Return URL after Stripe onboarding
}

export class UpdateAuthorProfileDto {
  @IsOptional()
  @IsBoolean()
  tipsEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(100) // Minimum $1
  minimumTipAmount?: number;
}
