import {
  ValidationPipe,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';

/**
 * StrictValidationPipe - Enhanced validation with security focus.
 *
 * Prevents:
 * - Mass assignment attacks (extra fields in DTO)
 * - Type confusion attacks
 * - Prototype pollution
 */
export class StrictValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on non-whitelisted
      forbidUnknownValues: true, // Reject unknown objects
      transform: true,
      transformOptions: {
        enableImplicitConversion: false, // Strict type checking
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((err) => {
          if (err.constraints) {
            return Object.values(err.constraints).join(', ');
          }
          return `Invalid value for ${err.property}`;
        });
        return new BadRequestException(messages);
      },
    });
  }
}
