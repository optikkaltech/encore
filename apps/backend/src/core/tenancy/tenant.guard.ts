import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TenantContextService } from './tenant-context.service';
import { TenantContext } from '../../shared/interfaces';
import { IS_PUBLIC_KEY } from '../../common/decorators/security.decorators';

interface JwtPayload {
  sub: string;
  merchantId: string;
  email: string;
  role: string;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tenantContext: TenantContextService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<any>(token);

      // Set tenant context for this request
      const tenantContext: TenantContext = {
        merchantId: payload.merchantId || payload.sub,
        isSuperAdmin: payload.role === 'super_admin',
      };

      this.tenantContext.setTenant(tenantContext);

      // Attach user info to request for controllers
      request['user'] = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
