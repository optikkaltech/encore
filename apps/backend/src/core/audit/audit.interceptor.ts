import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Scope,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from './audit.service';

/**
 * AuditInterceptor - Automatically logs all controller actions.
 *
 * Apply globally or per-controller to capture:
 * - All API requests
 * - Response status
 * - Execution time
 * - User context
 */
@Injectable({ scope: Scope.REQUEST })
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Build action name from controller + method
    const controllerName = controller.name
      .replace('Controller', '')
      .toLowerCase();
    const methodName = handler.name;
    const action = `${controllerName}.${methodName}`;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;

          // Log successful request (async for performance)
          this.auditService.logAsync(
            {
              action,
              entityType: controllerName,
              metadata: {
                duration,
                statusCode: 200,
              },
              result: 'success',
            },
            request,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          // Log failed request (sync for security)
          this.auditService.log(
            {
              action,
              entityType: controllerName,
              metadata: {
                duration,
                statusCode: error.status || 500,
                errorCode: error.code,
              },
              result: error.status === 403 ? 'denied' : 'failure',
              errorMessage: error.message,
              severity: error.status === 403 ? 'warning' : 'normal',
            },
            request,
          );
        },
      }),
    );
  }
}
