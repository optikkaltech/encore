import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for subscriber portal routes.
 * Uses the 'subscriber-portal-jwt' strategy (separate from merchant 'jwt').
 * Applied to all /portal/* data endpoints.
 */
@Injectable()
export class PortalGuard extends AuthGuard('subscriber-portal-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
