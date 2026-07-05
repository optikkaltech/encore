import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/payout.dto';
import { Secure } from '../../common/decorators/security.decorators';
import { TenantGuard } from '../../core/tenancy';
import { CurrentMerchant } from '../../core/tenancy';
import { Audit } from '../../core/audit';
import { NombaService } from '../../core/nomba/nomba.service';

@Controller('payouts')
@UseGuards(TenantGuard)
@Secure()
export class PayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly nombaService: NombaService,
  ) {}

  /**
   * GET /api/v1/payouts/banks
   * Get supported banks list from Nomba.
   */
  @Get('banks')
  async getBanks() {
    const banks = await this.nombaService.getBanks();
    return { success: true, data: banks };
  }

  /**
   * GET /api/v1/payouts/resolve
   * Perform bank account lookup (name enquiry).
   */
  @Get('resolve')
  async resolveAccount(
    @Query('accountNumber') accountNumber: string,
    @Query('bankCode') bankCode: string,
  ) {
    const result = await this.nombaService.resolveBankAccount(accountNumber, bankCode);
    return { success: true, data: result };
  }

  /**
   * GET /api/v1/payouts/balance
   * Returns the merchant's current available payout balance from the ledger.
   */
  @Get('balance')
  async getBalance(@CurrentMerchant() merchantId: string) {
    const balance = await this.payoutsService.getAvailableBalance(merchantId);
    return { success: true, data: balance };
  }

  /**
   * GET /api/v1/payouts
   * List all payouts for the merchant.
   */
  @Get()
  async findAll(@CurrentMerchant() merchantId: string) {
    const payouts = await this.payoutsService.findAll(merchantId);
    return { success: true, data: payouts };
  }

  /**
   * GET /api/v1/payouts/ledger
   * Full double-entry ledger for accounting review.
   */
  @Get('ledger')
  async getLedger(@CurrentMerchant() merchantId: string) {
    const entries = await this.payoutsService.getLedger(merchantId);
    return { success: true, data: entries };
  }

  /**
   * GET /api/v1/payouts/:id
   * Get a single payout detail.
   */
  @Get(':id')
  async findOne(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
  ) {
    const payout = await this.payoutsService.findOne(merchantId, id);
    return { success: true, data: payout };
  }

  /**
   * POST /api/v1/payouts
   * Request a new payout — validates balance, triggers Nomba transfer.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Audit({ action: 'PAYOUT_REQUEST', entityType: 'payout', severity: 'critical' })
  async createPayout(
    @CurrentMerchant() merchantId: string,
    @Body() dto: CreatePayoutDto,
  ) {
    const payout = await this.payoutsService.createPayout(merchantId, dto);
    return {
      success: true,
      data: payout,
      message:
        payout.status === 'completed'
          ? `Payout of ₦${payout.netAmount} sent successfully to ${payout.bankAccountName}.`
          : `Payout of ₦${payout.requestedAmount} failed: ${payout.failureReason}`,
    };
  }

  /**
   * PATCH /api/v1/payouts/:id/cancel
   * Cancel a PENDING payout and reverse the ledger debit.
   */
  @Patch(':id/cancel')
  @Audit({ action: 'PAYOUT_CANCEL', entityType: 'payout' })
  async cancelPayout(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
  ) {
    const payout = await this.payoutsService.cancelPayout(merchantId, id);
    return {
      success: true,
      data: payout,
      message: 'Payout cancelled and balance restored.',
    };
  }
}
