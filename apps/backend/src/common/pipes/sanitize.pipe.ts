import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * SanitizePipe - Prevents injection attacks by sanitizing all string inputs.
 *
 * Defends against:
 * - SQL injection
 * - NoSQL injection
 * - Command injection
 * - XSS attempts in input
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  // SQL injection patterns
  private readonly sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Basic SQLi
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // Equal sign injection
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT)\b/i, // SQL keywords
    /(\%3C)|<[^\n]*((\%3E)|>)/i, // HTML/XML injection
    /\b(OR|AND)\s+\d+\s*=\s*\d+/i, // Boolean-based SQLi
  ];

  // NoSQL injection patterns
  private readonly noSqlPatterns = [
    /\$\$?[a-zA-Z]+/, // MongoDB operators ($eq, $gt, $where, etc.)
    /\{[^}]*\$\$?[a-zA-Z]+[^}]*\}/, // Nested MongoDB operators
  ];

  // Command injection patterns
  private readonly commandPatterns = [
    /[;&|`$\n\r]/, // Shell metacharacters
    /\$\(.*\)/, // Command substitution
    /`.*`/, // Backtick execution
    /\b(curl|wget|nc|netcat|bash|sh|cmd|powershell|python|perl|ruby)\b/i,
  ];

  // Path traversal patterns
  private readonly pathTraversalPatterns = [
    /\.\.\//, // Unix traversal
    /\.\.\\/, // Windows traversal
    /%2e%2e%2f/i, // URL encoded traversal
    /%252e%252e%252f/i, // Double-encoded traversal
  ];

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!value) return value;

    // Check if it's an object (DTO)
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }

    // Check if it's a string
    if (typeof value === 'string') {
      return this.sanitizeString(value, metadata.data || 'input');
    }

    // Check if it's an array
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        this.transform(item, {
          ...metadata,
          data: `${metadata.data}[${index}]`,
        }),
      );
    }

    return value;
  }

  private sanitizeObject(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key itself (prevent NoSQL injection via keys)
      const sanitizedKey = this.sanitizeKey(key);

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value, key);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[sanitizedKey] = value.map((item, index) => {
            if (typeof item === 'string') {
              return this.sanitizeString(item, `${key}[${index}]`);
            }
            if (typeof item === 'object' && item !== null) {
              return this.sanitizeObject(item as Record<string, unknown>);
            }
            return item;
          });
        } else {
          sanitized[sanitizedKey] = this.sanitizeObject(
            value as Record<string, unknown>,
          );
        }
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  private sanitizeKey(key: string): string {
    // Remove NoSQL operators from keys
    if (key.startsWith('$')) {
      throw new BadRequestException(`Invalid key: ${key}`);
    }
    // Remove dots (prevent nested field injection)
    return key.replace(/\./g, '_');
  }

  private sanitizeString(value: string, fieldName: string): string {
    // If it is a valid hex color, bypass sanitization (safe since it only contains # and hex digits)
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
      return value;
    }

    // Additional XSS prevention - preserve URL structure for link/callback fields
    const isUrlField =
      /url|link|callback|uri|redirect|href/i.test(fieldName) ||
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('/');

    if (isUrlField) {
      if (!this.isSafeUrl(value)) {
        throw new BadRequestException(
          `Invalid or unsafe URL format in field '${fieldName}'`,
        );
      }
      return this.escapeUrlXSS(value);
    }

    // Check SQL injection
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(value)) {
        throw new BadRequestException(
          `SQL injection detected in field '${fieldName}'`,
        );
      }
    }

    // Check NoSQL injection
    for (const pattern of this.noSqlPatterns) {
      if (pattern.test(value)) {
        throw new BadRequestException(
          `NoSQL injection detected in field '${fieldName}'`,
        );
      }
    }

    // Check command injection
    for (const pattern of this.commandPatterns) {
      if (pattern.test(value)) {
        throw new BadRequestException(
          `Command injection detected in field '${fieldName}'`,
        );
      }
    }

    // Check path traversal
    for (const pattern of this.pathTraversalPatterns) {
      if (pattern.test(value)) {
        throw new BadRequestException(
          `Path traversal detected in field '${fieldName}'`,
        );
      }
    }

    return this.escapeXSS(value);
  }

  private escapeUrlXSS(value: string): string {
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  private escapeXSS(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  private isSafeUrl(url: string): boolean {
    if (url.startsWith('/')) {
      return !url.includes('javascript:');
    }
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
