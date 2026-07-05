import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUrl,
  Min,
  Max,
  ValidateNested,
  IsObject,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationsDto {
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  sms?: boolean;
}

class BillingSettingsDto {
  @IsBoolean()
  @IsOptional()
  autoRetry?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  retryAttempts?: number;
}

class PayoutBankAccountDto {
  @IsString()
  bankCode: string;

  @IsString()
  bankName: string;

  @IsString()
  accountNumber: string;

  @IsString()
  accountName: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsUrl({}, { message: 'webhookUrl must be a valid URL' })
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  webhookSecret?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationsDto)
  notifications?: NotificationsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BillingSettingsDto)
  billing?: BillingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PayoutBankAccountDto)
  payoutBankAccount?: PayoutBankAccountDto;
}


export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  brandLogoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  brandPrimaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customDomain?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  country?: string;
}

