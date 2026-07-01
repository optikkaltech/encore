import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ModuleRef } from '@nestjs/core';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: '/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const email = emails[0].value;
    const businessName = name.givenName || email.split('@')[0];
    const picture = photos[0]?.value;

    const authService = await this.moduleRef.resolve(AuthService);
    const { merchant, isNew } = await authService.handleGoogleAuth(
      id,
      email,
      businessName,
      picture,
    );

    return { merchant, isNew };
  }
}
