import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { StorageConfig, StorageProvider } from '../../config/storage.config';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  url: string;
  key: string;
  provider: StorageProvider;
}

/**
 * Storage Service - Handles file uploads to local filesystem or S3-compatible storage
 *
 * Railway Deployment Options:
 * 1. Local + Railway Volume (persistent disk)
 * 2. S3-compatible (Cloudflare R2, MinIO, etc.)
 *
 * Security features:
 * - File type validation (whitelist)
 * - File size limits
 * - Unique filename generation (prevents overwrites)
 * - Malware scanning placeholder
 * - Path traversal prevention
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: MinioClient | null = null;
  private config: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<StorageConfig>('storage')!;

    if (this.config.provider === 's3') {
      this.minioClient = new MinioClient({
        endPoint: this.extractEndpoint(this.config.s3.endpoint),
        port: this.extractPort(this.config.s3.endpoint),
        useSSL: this.config.s3.endpoint?.startsWith('https') ?? true,
        accessKey: this.config.s3.accessKeyId,
        secretKey: this.config.s3.secretAccessKey,
        region: this.config.s3.region,
      });
    }
  }

  /**
   * Upload file to configured storage
   */
  async uploadFile(
    file: UploadedFile,
    folder: string,
    entityId: string,
  ): Promise<UploadResult> {
    // Validate file
    this.validateFile(file);

    // Scan for malware (placeholder)
    await this.scanForMalware(file);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedFilename = this.sanitizeFilename(file.originalname);
    const key = `${folder}/${entityId}/${timestamp}-${randomString}-${sanitizedFilename}`;

    if (this.config.provider === 's3' && this.minioClient) {
      return this.uploadToS3(file, key);
    } else {
      return this.uploadToLocal(file, key);
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(key: string): Promise<void> {
    if (this.config.provider === 's3' && this.minioClient) {
      await this.deleteFromS3(key);
    } else {
      await this.deleteFromLocal(key);
    }
  }

  /**
   * Upload to S3-compatible storage (R2, MinIO, etc.)
   */
  private async uploadToS3(
    file: UploadedFile,
    key: string,
  ): Promise<UploadResult> {
    if (!this.minioClient) {
      throw new InternalServerErrorException('S3 client not initialized');
    }

    try {
      await this.minioClient.putObject(
        this.config.s3.bucket,
        key,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Upload-Date': new Date().toISOString(),
        },
      );

      // Build URL
      let url: string;
      if (this.config.s3.endpoint) {
        // Custom endpoint (R2, MinIO)
        url = `${this.config.s3.endpoint}/${this.config.s3.bucket}/${key}`;
      } else {
        // AWS S3 standard
        url = `https://${this.config.s3.bucket}.s3.${this.config.s3.region}.amazonaws.com/${key}`;
      }

      this.logger.log(`File uploaded to S3: ${key}`);

      return {
        url,
        key,
        provider: 's3',
      };
    } catch (error) {
      this.logger.error('S3 upload failed', error);
      throw new InternalServerErrorException(
        'Failed to upload file to storage',
      );
    }
  }

  /**
   * Upload to local filesystem
   */
  private async uploadToLocal(
    file: UploadedFile,
    key: string,
  ): Promise<UploadResult> {
    const fullPath = path.join(this.config.local.uploadDir, key);
    const dir = path.dirname(fullPath);

    try {
      // Ensure directory exists
      await mkdir(dir, { recursive: true });

      // Write file
      await writeFile(fullPath, file.buffer);

      // Build URL
      const url = `${this.config.local.baseUrl}/${key}`;

      this.logger.log(`File uploaded locally: ${key}`);

      return {
        url,
        key,
        provider: 'local',
      };
    } catch (error) {
      this.logger.error('Local upload failed', error);
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  /**
   * Delete from S3
   */
  private async deleteFromS3(key: string): Promise<void> {
    if (!this.minioClient) return;

    try {
      await this.minioClient.removeObject(this.config.s3.bucket, key);
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error('S3 delete failed', error);
    }
  }

  /**
   * Delete from local
   */
  private async deleteFromLocal(key: string): Promise<void> {
    const fullPath = path.join(this.config.local.uploadDir, key);

    try {
      if (await exists(fullPath)) {
        await unlink(fullPath);
        this.logger.log(`File deleted locally: ${key}`);
      }
    } catch (error) {
      this.logger.error('Local delete failed', error);
    }
  }

  /**
   * Validate file type and size
   */
  private validateFile(file: UploadedFile): void {
    // Check file size
    if (file.size > this.config.limits.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds ${this.config.limits.maxFileSize / 1024 / 1024}MB limit`,
      );
    }

    // Check MIME type
    if (!this.config.limits.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.config.limits.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Scan for malware (placeholder - integrate with ClamAV in production)
   */
  private async scanForMalware(file: UploadedFile): Promise<void> {
    // TODO: Integrate with ClamAV or VirusTotal API
    // For now, just check for common malware signatures in filename
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.dll$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.sh$/i,
      /\.php$/i,
      /script/i,
    ];

    const hasSuspiciousPattern = suspiciousPatterns.some((pattern) =>
      pattern.test(file.originalname),
    );

    if (hasSuspiciousPattern) {
      throw new BadRequestException('Suspicious file name detected');
    }
  }

  /**
   * Sanitize filename to prevent path traversal and special characters
   */
  private sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    const basename = path.basename(filename);

    // Remove special characters, keep only alphanumeric, dots, dashes, underscores
    const sanitized = basename.replace(/[^a-zA-Z0-9.-_]/g, '_');

    // Limit length
    const maxLength = 100;
    const name = path.parse(sanitized).name.slice(0, maxLength);
    const ext = path.parse(sanitized).ext.slice(0, 10);

    return `${name}${ext}`;
  }

  /**
   * Extract endpoint host from URL
   */
  private extractEndpoint(endpoint?: string): string {
    if (!endpoint) return 's3.amazonaws.com';

    try {
      const url = new URL(endpoint);
      return url.hostname;
    } catch {
      return endpoint.replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  /**
   * Extract port from URL
   */
  private extractPort(endpoint?: string): number {
    if (!endpoint) return 443;

    try {
      const url = new URL(endpoint);
      return url.port
        ? parseInt(url.port, 10)
        : url.protocol === 'https:'
          ? 443
          : 80;
    } catch {
      return 443;
    }
  }
}
