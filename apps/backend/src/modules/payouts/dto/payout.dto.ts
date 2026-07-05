import { IsNotEmpty, IsNumber, IsString, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayoutDto {
  @IsNumber()
  @Min(100, { message: 'Minimum payout amount is ₦100' })
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  bankAccountName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
