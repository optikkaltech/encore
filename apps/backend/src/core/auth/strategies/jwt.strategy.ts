import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../../modules/merchants/entities/merchant.entity';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('app.jwtSecret') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<Merchant> {
    const merchant = await this.merchantRepo.findOne({
      where: { id: payload.sub },
    });

    if (!merchant) {
      throw new UnauthorizedException('Invalid token');
    }

    if (merchant.status === 'suspended') {
      throw new UnauthorizedException('Account suspended');
    }

    return merchant;
  }
}
