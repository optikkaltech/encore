import { Controller, Get, Post, Body, UseGuards, Param, Res } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { Secure } from '../../common/decorators/security.decorators';
import { TenantGuard } from '../../core/tenancy';
import { CurrentMerchant } from '../../core/tenancy';
import { Audit } from '../../core/audit';
import type { Response } from 'express';

@Controller('billing')
@UseGuards(TenantGuard)
@Secure()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @Audit({ action: 'INVOICE_CREATE', entityType: 'invoice' })
  async createInvoice(
    @CurrentMerchant() merchantId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    const invoice = await this.billingService.createInvoice(merchantId, dto);
    return {
      success: true,
      data: invoice,
      message: 'Invoice generated and paid successfully.',
    };
  }

  @Get('invoices')
  async findAllInvoices(@CurrentMerchant() merchantId: string) {
    const invoices = await this.billingService.findAllInvoices(merchantId);
    return {
      success: true,
      data: invoices,
    };
  }

  @Get('invoices/:id/download')
  async downloadInvoice(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.billingService.streamInvoicePdf(id, merchantId, res);
  }

  @Get('transactions')
  async findAllTransactions(@CurrentMerchant() merchantId: string) {
    const transactions =
      await this.billingService.findAllTransactions(merchantId);
    return {
      success: true,
      data: transactions,
    };
  }
}
