import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import { Invoice } from '../billing/entities/invoice.entity';
import { Subscriber } from '../subscribers/entities/subscriber.entity';
import { Merchant } from '../merchants/entities/merchant.entity';

/**
 * Generates PDF invoices on-the-fly using pdfkit.
 * No file storage needed — streams directly to HTTP response.
 */
@Injectable()
export class PortalPdfService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {}

  async streamInvoicePdf(
    invoiceId: string,
    subscriber: Subscriber,
    res: Response,
  ): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, subscriberId: subscriber.id },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const merchant = await this.merchantRepo.findOne({
      where: { id: subscriber.merchantId },
    });
    const businessName = merchant?.businessName || 'Your Provider';

    this.generatePdf(invoice, businessName, res);
  }

  async streamInvoicePdfForMerchant(
    invoiceId: string,
    merchantId: string,
    res: Response,
  ): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, merchantId },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const merchant = await this.merchantRepo.findOne({
      where: { id: merchantId },
    });
    const businessName = merchant?.businessName || 'Your Provider';

    this.generatePdf(invoice, businessName, res);
  }

  private generatePdf(
    invoice: Invoice,
    businessName: string,
    res: Response,
  ): void {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    );

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text(businessName, 50, 50);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666')
      .text('Invoice', 50, 80);

    // Invoice metadata
    doc.fillColor('#000').fontSize(11);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 350, 50, {
      align: 'right',
    });
    doc.text(
      `Date: ${new Date(invoice.paidAt || invoice.createdAt).toLocaleDateString('en-NG')}`,
      350,
      68,
      { align: 'right' },
    );
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 350, 86, {
      align: 'right',
    });

    doc.moveTo(50, 110).lineTo(545, 110).stroke('#e0e0e0');

    // Bill To
    doc.fontSize(10).fillColor('#666').text('BILL TO', 50, 125);
    doc.fontSize(11).fillColor('#000');
    doc.text(`${invoice.customerName}`, 50, 140);
    doc.text(invoice.customerEmail, 50, 156);

    // Line items table header
    doc.moveTo(50, 190).lineTo(545, 190).stroke('#e0e0e0');
    doc.fontSize(9).fillColor('#666');
    doc.text('DESCRIPTION', 50, 200);
    doc.text('QTY', 330, 200);
    doc.text('UNIT PRICE', 385, 200);
    doc.text('AMOUNT', 480, 200, { align: 'right' });
    doc.moveTo(50, 215).lineTo(545, 215).stroke('#e0e0e0');

    // Line items
    let y = 225;
    doc.fillColor('#000').fontSize(10);
    for (const item of invoice.lineItems || []) {
      doc.text(item.description, 50, y, { width: 270 });
      doc.text(String(item.quantity), 330, y);
      doc.text(
        `₦${Number(item.unitPrice).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        385,
        y,
      );
      doc.text(
        `₦${Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        480,
        y,
        { align: 'right' },
      );
      y += 22;
    }

    // Totals
    doc
      .moveTo(350, y + 5)
      .lineTo(545, y + 5)
      .stroke('#e0e0e0');
    doc
      .fontSize(10)
      .fillColor('#666')
      .text('Subtotal', 350, y + 15);
    doc
      .fillColor('#000')
      .text(
        `₦${Number(invoice.subtotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        480,
        y + 15,
        { align: 'right' },
      );

    if (Number(invoice.taxAmount) > 0) {
      doc.fillColor('#666').text('VAT', 350, y + 35);
      doc
        .fillColor('#000')
        .text(
          `₦${Number(invoice.taxAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
          480,
          y + 35,
          { align: 'right' },
        );
    }

    doc
      .moveTo(350, y + 50)
      .lineTo(545, y + 50)
      .stroke('#000');
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#000')
      .text('TOTAL', 350, y + 58);
    doc.text(
      `${invoice.currency} ${Number(invoice.totalAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      480,
      y + 58,
      { align: 'right' },
    );

    // Footer
    doc.fontSize(9).font('Helvetica').fillColor('#999');
    doc.text('Generated by Encore Subscription Billing', 50, 760, {
      align: 'center',
    });

    doc.end();
  }
}
