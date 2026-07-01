import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from '../entities/subscriber.entity';
import { PortalJwtPayload } from '../portal-auth.service';

/**
 * Separate Passport strategy for subscriber portal JWTs.
 * Named 'subscriber-portal-jwt' to avoid conflict with merchant 'jwt' strategy.
 */
@Injectable()
export class PortalJwtStrategy extends PassportStrategy(
  Strategy,
  'subscriber-portal-jwt',
) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('app.jwtSecret') || 'fallback-secret',
    });
  }

  async validate(payload: PortalJwtPayload): Promise<Subscriber> {
    // Enforce that this is strictly a subscriber portal token
    if (payload.type !== 'subscriber_portal') {
      throw new UnauthorizedException('Invalid portal token');
    }

    const subscriber = await this.subscriberRepo.findOne({
      where: { id: payload.sub, merchantId: payload.merchantId },
      relations: { subscriptions: { plan: true } },
    });

    if (!subscriber) {
      throw new UnauthorizedException('Subscriber not found');
    }

    return subscriber;
  }
}
