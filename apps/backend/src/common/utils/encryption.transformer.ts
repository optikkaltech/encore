import { ValueTransformer } from 'typeorm';
import { encryptAtRest, decryptAtRest } from './security.utils';

/**
 * TypeORM ValueTransformer for automatic PII encryption at rest.
 *
 * Usage:
 * @Column({ transformer: new EncryptionTransformer() })
 * email: string;
 *
 * NDPR Compliant: All PII encrypted in database.
 */
export class EncryptionTransformer implements ValueTransformer {
  private encryptionKey: string | undefined;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Encrypt when saving to database
   */
  to(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return value as null;
    }
    if (value === '') {
      return '';
    }

    try {
      return encryptAtRest(value, this.encryptionKey);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt when reading from database
   */
  from(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return value as null;
    }
    if (value === '') {
      return '';
    }

    // Check if value is already encrypted (has the format iv:authTag:ciphertext)
    if (!value.includes(':')) {
      // Value is not encrypted, return as-is (migration case)
      return value;
    }

    try {
      return decryptAtRest(value, this.encryptionKey);
    } catch (error) {
      console.error('Decryption failed:', error);
      // If decryption fails, return masked value to prevent data leakage
      return '[ENCRYPTED]';
    }
  }
}

/**
 * Transformer for JSON objects - encrypts the entire JSON string
 */
export class JsonEncryptionTransformer implements ValueTransformer {
  private encryptionKey: string | undefined;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey;
  }

  to(value: Record<string, unknown> | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      const jsonString = JSON.stringify(value);
      return encryptAtRest(jsonString, this.encryptionKey);
    } catch (error) {
      console.error('JSON encryption failed:', error);
      throw new Error('Failed to encrypt settings data');
    }
  }

  from(value: string | null | undefined): Record<string, unknown> | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Check if value is encrypted
    if (!value.includes(':')) {
      // Plain JSON string (migration case)
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }

    try {
      const decrypted = decryptAtRest(value, this.encryptionKey);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('JSON decryption failed:', error);
      return null;
    }
  }
}
