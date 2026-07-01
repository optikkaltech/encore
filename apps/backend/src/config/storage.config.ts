import { registerAs } from '@nestjs/config';

/**
 * Storage Provider Types
 * - local: Local filesystem (use Railway Volume for persistence in production)
 * - s3: S3-compatible storage (R2, MinIO, AWS S3, etc.)
 */
export type StorageProvider = 'local' | 's3';

export interface StorageConfig {
  provider: StorageProvider;
  local: {
    uploadDir: string;
    baseUrl: string;
  };
  /** S3-compatible storage config (works with R2, MinIO, AWS S3) */
  s3: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string; // For R2, MinIO, or other S3-compatible services
    forcePathStyle?: boolean; // Required for R2 and MinIO
  };
  limits: {
    maxFileSize: number; // bytes
    allowedMimeTypes: string[];
  };
}

export default registerAs(
  'storage',
  (): StorageConfig => ({
    // Use 'local' for dev, 's3' for production with R2/MinIO
    provider: (process.env.STORAGE_PROVIDER as StorageProvider) || 'local',

    // Local filesystem storage
    // For Railway: mount a Volume to this directory for persistence
    local: {
      uploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
      baseUrl: process.env.LOCAL_BASE_URL || 'http://localhost:3000/uploads',
    },

    // S3-compatible storage (Cloudflare R2, MinIO, AWS S3)
    // Railway-compatible: Use R2 or MinIO for object storage
    s3: {
      region: process.env.S3_REGION || 'auto',
      bucket: process.env.S3_BUCKET || 'encore-documents',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      // For Cloudflare R2: https://<account-id>.r2.cloudflarestorage.com
      // For MinIO: http://localhost:9000
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    },

    limits: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ],
    },
  }),
);
