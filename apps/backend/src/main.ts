import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

/**
 * Encore Backend Bootstrap - Security Hardened
 *
 * Layers:
 * 1. Helmet - Security headers (CSP, HSTS, etc.)
 * 2. Compression - Response compression
 * 3. Body size limits - Prevent DoS
 * 4. CORS - Controlled cross-origin
 * 5. Cookie parsing - For CSRF protection
 * 6. Graceful shutdown - Clean resource release
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    // Disable default powered-by header
    cors: false, // We'll configure CORS manually
  });

  // Trust proxy headers (e.g. X-Forwarded-Proto, X-Forwarded-Host) set by Railway ingress
  app.set('trust proxy', 1);

  const config = app.get(ConfigService);
  const port = config.get('app.port') || 3000;
  const env = config.get('app.environment') || 'development';

  // 1. Body size limits - Prevent DoS via large payloads
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 10 * 1024 * 1024) {
      // 10MB limit
      res.status(413).json({
        error: 'Payload too large',
        requestId: req['requestId'],
      });
      return;
    }
    next();
  });

  // 2. Helmet - Comprehensive security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts:
        env === 'production'
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : undefined,
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
  );

  // 3. Compression - Gzip responses
  app.use(
    compression({
      level: 6,
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );

  // 4. Cookie parser - Required for CSRF protection
  app.use(cookieParser(config.get('app.jwtSecret')));

  // 5. CORS - Strict origin control
  app.enableCors({
    origin:
      env === 'production'
        ? (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
          ) => {
            // Whitelist check in production
            const allowedOrigins =
              config.get<string>('app.allowedOrigins')?.split(',') || [];
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        : true, // Allow all in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24 hours
  });

  // 6. API versioning prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'webhooks/nomba'], // Public endpoints without prefix
  });

  // 7. Global validation pipe (additional layer)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      disableErrorMessages: env === 'production', // Don't expose validation internals
    }),
  );

  // 8. Graceful shutdown handling
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      app
        .close()
        .then(() => {
          console.log('HTTP server closed');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Error during shutdown:', err);
          process.exit(1);
        });

      // Force exit after timeout
      setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000); // 30 seconds
    });
  });

  // 9. Unhandled error handlers
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Give time for logs to flush before exiting
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit, just log - let the app continue running
  });

  // Start server
  await app.listen(port, '0.0.0.0');

  console.log(`
  ========================================
  🎵 Encore Backend Started
  ========================================
  Environment: ${env}
  Port: ${port}
  API: http://localhost:${port}/api/v1
  Health: http://localhost:${port}/health
  ========================================
  `);
}

bootstrap();
