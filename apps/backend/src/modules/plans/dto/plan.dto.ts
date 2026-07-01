import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Length,
} from 'class-validator';
import { BillingFrequency } from '../../../shared/enums';

export class CreatePlanDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(2, 50)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(BillingFrequency)
  frequency?: BillingFrequency = BillingFrequency.MONTHLY;

  @IsOptional()
  @IsNumber()
  @Min(1)
  customDays?: number;

  @IsOptional()
  @IsString()
  @Length(3, 10)
  currency?: string = 'NGN';

  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  setupFee?: number = 0;

  @IsOptional()
  @IsBoolean()
  isProrated?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isUsageBased?: boolean = false;

  @IsOptional()
  @IsString()
  usageMetric?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usageRate?: number;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
