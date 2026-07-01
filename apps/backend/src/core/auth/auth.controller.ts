import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/security.decorators';
import { Audit } from '../audit';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Manual registration with email/password
   * POST /api/v1/auth/register
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Audit({
    action: 'AUTH_REGISTER',
    entityType: 'merchant',
    severity: 'normal',
  })
  async register(@Body() dto: RegisterDto) {
    const merchant = await this.authService.registerManual(
      dto.businessName,
      dto.email,
      dto.password,
      dto.phone,
      dto.businessType,
    );

    return {
      success: true,
      data: {
        id: merchant.id,
        businessName: merchant.businessName,
        email: merchant.email,
        message:
          'Registration successful. Please check your email to verify your account.',
      },
    };
  }

  /**
   * Email/password login
   * POST /api/v1/auth/login
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Audit({ action: 'AUTH_LOGIN', entityType: 'merchant', severity: 'normal' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.email, dto.password);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  /**
   * Verify email address
   * GET /api/v1/auth/verify-email?token=xxx
   */
  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: 'EMAIL_VERIFIED',
    entityType: 'merchant',
    severity: 'normal',
  })
  async verifyEmail(@Query() query: VerifyEmailDto) {
    await this.authService.verifyEmail(query.token);
    return {
      success: true,
      message: 'Email verified successfully. You can now log in.',
    };
  }

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'merchant',
    severity: 'normal',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: 'PASSWORD_RESET_COMPLETED',
    entityType: 'merchant',
    severity: 'critical',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return {
      success: true,
      message:
        'Password reset successfully. You can now log in with your new password.',
    };
  }

  /**
   * Google OAuth - Initiate login
   * GET /api/v1/auth/google
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard redirects to Google
  }

  /**
   * Google OAuth - Callback
   * GET /api/v1/auth/google/callback
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @Audit({
    action: 'GOOGLE_AUTH_CALLBACK',
    entityType: 'merchant',
    severity: 'normal',
  })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const { merchant, isNew } = req.user as { merchant: any; isNew: boolean };

    // Generate tokens (OAuth bypasses password check)
    const tokens = await this.authService.loginOAuth(merchant.id);

    // Redirect to frontend with tokens
    const redirectUrl =
      `${process.env.FRONTEND_URL}/auth/callback?` +
      `access_token=${tokens.access_token}&` +
      `refresh_token=${tokens.refresh_token}&` +
      `is_new=${isNew}&` +
      `onboarding_required=${isNew}`;

    res.redirect(redirectUrl);
  }
}
