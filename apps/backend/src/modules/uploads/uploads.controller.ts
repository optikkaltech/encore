import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../../core/storage/storage.service';
import { TenantGuard, CurrentMerchant } from '../../core/tenancy';
import { Secure } from '../../common/decorators/security.decorators';
import { Audit } from '../../core/audit';

/**
 * File Upload Controller
 *
 * Handles secure file uploads for:
 * - KYC documents (CAC certificate, tax clearance, bank statement)
 * - Merchant logos/branding
 * - Other document uploads
 *
 * Storage: Local (dev) or S3-compatible (R2, MinIO in production)
 */
@Controller('uploads')
@UseGuards(TenantGuard)
@Secure()
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload CAC Certificate
   * POST /api/v1/uploads/kyc/cac
   */
  @Post('kyc/cac')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: 'KYC_DOC_UPLOAD',
    entityType: 'merchant',
    severity: 'normal',
  })
  async uploadCacCertificate(
    @CurrentMerchant() merchantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.storageService.uploadFile(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      'kyc/cac',
      merchantId,
    );

    return {
      success: true,
      data: {
        url: result.url,
        key: result.key,
        type: 'cac_certificate',
      },
    };
  }

  /**
   * Upload Tax Clearance Certificate
   * POST /api/v1/uploads/kyc/tax
   */
  @Post('kyc/tax')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: 'KYC_DOC_UPLOAD',
    entityType: 'merchant',
    severity: 'normal',
  })
  async uploadTaxClearance(
    @CurrentMerchant() merchantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.storageService.uploadFile(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      'kyc/tax',
      merchantId,
    );

    return {
      success: true,
      data: {
        url: result.url,
        key: result.key,
        type: 'tax_clearance',
      },
    };
  }

  /**
   * Upload Bank Statement
   * POST /api/v1/uploads/kyc/bank
   */
  @Post('kyc/bank')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: 'KYC_DOC_UPLOAD',
    entityType: 'merchant',
    severity: 'normal',
  })
  async uploadBankStatement(
    @CurrentMerchant() merchantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.storageService.uploadFile(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      'kyc/bank',
      merchantId,
    );

    return {
      success: true,
      data: {
        url: result.url,
        key: result.key,
        type: 'bank_statement',
      },
    };
  }

  /**
   * Upload Merchant Logo
   * POST /api/v1/uploads/branding/logo
   */
  @Post('branding/logo')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @Audit({ action: 'LOGO_UPLOAD', entityType: 'merchant', severity: 'normal' })
  async uploadLogo(
    @CurrentMerchant() merchantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Only allow images for logo
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Logo must be an image file');
    }

    const result = await this.storageService.uploadFile(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      'branding/logos',
      merchantId,
    );

    return {
      success: true,
      data: {
        url: result.url,
        key: result.key,
        type: 'logo',
      },
    };
  }
}
