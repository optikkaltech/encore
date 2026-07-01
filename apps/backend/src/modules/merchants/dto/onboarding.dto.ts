import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { BusinessType, PricingTier } from '../../../shared/enums';

/**
 * Merchant registration DTO - Step 1: Basic business info
 */
export class RegisterMerchantDto {
  @IsString()
  @Length(2, 255)
  businessName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 255)
  password: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @Length(10, 20)
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Invalid phone number format' })
  phone: string;

  @IsOptional()
  @IsEnum(PricingTier)
  selectedTier?: PricingTier;

  @IsOptional()
  @IsString()
  referralCode?: string;
}

/**
 * KYC submission DTO - Step 2: Business verification
 *
 * Document URLs should be obtained by uploading files first:
 * 1. POST /uploads/kyc/cac - returns cacCertificateUrl
 * 2. POST /uploads/kyc/tax - returns taxClearanceUrl
 * 3. POST /uploads/kyc/bank - returns bankStatementUrl
 */
export class SubmitKycDto {
  @IsOptional()
  @IsString()
  @Length(5, 50)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @Length(10, 20)
  taxId?: string;

  @IsString()
  @Length(10, 500)
  address: string;

  @IsString()
  @Length(2, 100)
  city: string;

  @IsString()
  @Length(2, 100)
  state: string;

  @IsString()
  @Length(2, 10)
  country: string = 'NG';

  // KYC Documents (URLs from file upload endpoints)
  // Upload first, then submit these URLs
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/, {
    message: 'CAC certificate must be a valid URL from upload endpoint',
  })
  cacCertificateUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/, {
    message: 'Tax clearance must be a valid URL from upload endpoint',
  })
  taxClearanceUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/, {
    message: 'Bank statement must be a valid URL from upload endpoint',
  })
  bankStatementUrl?: string;
}

/**
 * Payment setup DTO - Step 3: Platform fee payment method
 */
export class SetupPaymentMethodDto {
  @IsEnum(['card', 'direct_debit'])
  method: 'card' | 'direct_debit';

  // For card payments - Nomba token
  @IsOptional()
  @IsString()
  cardToken?: string;

  // For direct debit - Nomba mandate reference
  @IsOptional()
  @IsString()
  mandateId?: string;

  // TODO: Implement bank account validation for direct debit setup
  // @IsOptional()
  // @IsString()
  // bankAccountNumber?: string;

  // @IsOptional()
  // @IsString()
  // bankCode?: string;
}

/**
 * Select pricing tier DTO
 */
export class SelectTierDto {
  @IsEnum(PricingTier)
  tier: PricingTier;

  @IsOptional()
  @IsString()
  promoCode?: string;
}

/**
 * Initiate checkout DTO
 */
export class InitiateCheckoutDto {
  @IsEnum(['card', 'direct_debit'])
  method: 'card' | 'direct_debit';

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

/**
 * Verify checkout DTO
 */
export class VerifyCheckoutDto {
  @IsString()
  orderReference: string;

  @IsEnum(['card', 'direct_debit'])
  method: 'card' | 'direct_debit';
}
