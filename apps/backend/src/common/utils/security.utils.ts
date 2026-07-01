import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'crypto';

/**
 * Security utilities for data protection.
 *
 * All functions are designed for:
 * - NDPR compliance (encryption at rest)
 * - PCI-DSS compliance (no card data in logs/memory)
 * - Secure defaults
 */

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Hash sensitive data for comparison (one-way).
 * Use for: password comparison, token validation.
 */
export function hashSensitiveData(data: string, salt?: string): string {
  const effectiveSalt = salt || process.env.HASH_SALT || 'encore-default-salt';
  return createHash('sha256')
    .update(data + effectiveSalt)
    .digest('hex');
}

/**
 * Encrypt data at rest (two-way, reversible).
 * Use for: PII storage, API keys, sensitive configuration.
 */
export function encryptAtRest(plaintext: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  // Derive 32-byte key from provided key
  const derivedKey = createHash('sha256').update(encryptionKey).digest();

  const iv = randomBytes(16);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return IV + authTag + encrypted data
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data from storage.
 */
export function decryptAtRest(ciphertext: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  const derivedKey = createHash('sha256').update(encryptionKey).digest();

  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }

  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    derivedKey,
    Buffer.from(ivHex, 'hex'),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask card number - show only last 4 digits.
 * PCI-DSS: Never store or display full card numbers in logs/UI.
 */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\s/g, '');
  if (clean.length < 4) return '****';
  return `****-****-****-${clean.slice(-4)}`;
}

/**
 * Mask email - show only first 2 and last character.
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return '[INVALID_EMAIL]';

  const maskedLocal =
    localPart.length > 2
      ? `${localPart[0]}${localPart[1]}***${localPart[localPart.length - 1]}`
      : '***';

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number - show only last 3 digits.
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 3) return '***';
  return `***-***-${clean.slice(-3)}`;
}

/**
 * Generate cryptographically secure random token.
 */
export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate secure ID with prefix.
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

/**
 * Redact all PII from an object for logging.
 */
export function redactPii(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return redactString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactPii(item));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if key indicates sensitive field
      if (isSensitiveKey(lowerKey)) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'string' && looksLikePii(value)) {
        redacted[key] = redactString(value);
      } else {
        redacted[key] = redactPii(value);
      }
    }
    return redacted;
  }

  return obj;
}

function isSensitiveKey(key: string): boolean {
  const sensitivePatterns = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'credential',
    'ssn',
    'sin',
    'nin',
    'bvn',
    'cvv',
    'pin',
    'otp',
    'card',
    'iban',
    'account',
    'routing',
    'swift',
  ];

  return sensitivePatterns.some((pattern) => key.includes(pattern));
}

function looksLikePii(value: string): boolean {
  // Email pattern
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
  // Phone pattern
  if (/^\+?[\d\s-]{10,}$/.test(value)) return true;
  // Card pattern (16 digits)
  if (/^\d{16}$/.test(value.replace(/\s/g, ''))) return true;
  // SSN-like pattern
  if (/^\d{3}-?\d{2}-?\d{4}$/.test(value)) return true;

  return false;
}

function redactString(value: string): string {
  // Email
  if (value.includes('@')) {
    return maskEmail(value);
  }
  // Phone
  if (/^\+?[\d\s-]+$/.test(value)) {
    return maskPhone(value);
  }
  // Card number
  if (/^\d{15,16}$/.test(value.replace(/\s/g, ''))) {
    return maskCardNumber(value);
  }

  return value;
}

/**
 * Sanitize file name to prevent path traversal.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal sequences
  let sanitized = filename
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/^\/+/, '')
    .replace(/[\x00-\x1f\x7f]/g, ''); // Remove control characters

  // Remove dangerous extensions
  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.sh',
    '.php',
    '.jsp',
    '.asp',
  ];
  for (const ext of dangerousExtensions) {
    sanitized = sanitized.replace(new RegExp(ext, 'gi'), '.txt');
  }

  return sanitized;
}

/**
 * Validate and sanitize URL to prevent SSRF.
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Block private/internal IPs
    const hostname = parsed.hostname;
    if (isPrivateIp(hostname)) {
      return null;
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function isPrivateIp(hostname: string): boolean {
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^0\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ];

  return privatePatterns.some((pattern) => pattern.test(hostname));
}
