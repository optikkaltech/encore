import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsEmail } from 'class-validator';
import { PortalAuthService } from './portal-auth.service';
import { PortalGuard } from './guards/portal.guard';
import { Public } from '../../common/decorators/security.decorators';

class PortalLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  merchantId: string; // Merchant scoping — portal URL contains merchant ID
}

class SetPortalPasswordDto {
  @IsString()
  inviteToken: string;

  @IsString()
  password: string;
}

/**
 * Public portal authentication endpoints.
 * All routes are @Public() — no merchant auth needed.
 * Rate limiting should be applied at the infrastructure level.
 */
@Controller('portal/auth')
@Public()
export class PortalAuthController {
  constructor(private readonly portalAuthService: PortalAuthService) {}

  /**
   * POST /portal/auth/login
   * Subscriber logs in with email + password + merchantId.
   * Returns a short-lived portalToken (8h).
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: PortalLoginDto) {
    return this.portalAuthService.loginSubscriber(
      dto.merchantId,
      dto.email,
      dto.password,
    );
  }

  /**
   * POST /portal/auth/set-password
   * Subscriber activates their portal account using a merchant-issued invite token.
   */
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Body() dto: SetPortalPasswordDto) {
    await this.portalAuthService.setPortalPassword(
      dto.inviteToken,
      dto.password,
    );
    return { message: 'Portal password set successfully. You can now log in.' };
  }

  /**
   * GET /portal/auth/me
   * Returns the currently authenticated subscriber's identity.
   * Protected by PortalGuard (requires valid portalToken).
   */
  @Get('me')
  @UseGuards(PortalGuard)
  async getMe(@Request() req: any) {
    const s = req.user;
    return {
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      merchantId: s.merchantId,
      lastPortalLoginAt: s.lastPortalLoginAt,
    };
  }
}
