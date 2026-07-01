import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Subscriber } from './entities/subscriber.entity';
import { Merchant } from '../merchants/entities/merchant.entity';

export interface PortalJwtPayload {
  sub: string; // subscriberId
  merchantId: string;
  email: string;
  type: 'subscriber_portal';
  iat?: number;
  exp?: number;
}

export interface PortalLoginResult {
  portalToken: string;
  subscriber: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    merchantId: string;
  };
}

@Injectable()
export class PortalAuthService {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Sends a portal invite to subscriber (sets invite token, merchant calls this)
   */
  async sendPortalInvite(
    merchantId: string,
    subscriberId: string,
  ): Promise<{ inviteToken: string }> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId, merchantId },
    });
    if (!subscriber) throw new NotFoundException('Subscriber not found');

    const inviteToken = randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 72); // 72-hour invite window

    subscriber.portalInviteToken = inviteToken;
    subscriber.portalInviteExpires = expiry;
    await this.subscriberRepo.save(subscriber);

    return { inviteToken };
  }

  /**
   * Subscriber sets their portal password using a one-time invite token
   */
  async setPortalPassword(
    inviteToken: string,
    newPassword: string,
  ): Promise<void> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { portalInviteToken: inviteToken },
    });

    if (!subscriber || !subscriber.portalInviteExpires) {
      throw new BadRequestException('Invalid or expired invite token');
    }
    if (new Date() > subscriber.portalInviteExpires) {
      throw new BadRequestException('Invite token has expired');
    }

    subscriber.portalPasswordHash = await bcrypt.hash(newPassword, 12);
    subscriber.portalInviteToken = null as any;
    subscriber.portalInviteExpires = null as any;
    await this.subscriberRepo.save(subscriber);
  }

  /**
   * Login subscriber with email + password, scoped to a merchantId
   */
  async loginSubscriber(
    merchantId: string,
    email: string,
    password: string,
  ): Promise<PortalLoginResult> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { merchantId, email },
    });

    if (!subscriber || !subscriber.portalPasswordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(
      password,
      subscriber.portalPasswordHash,
    );
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    subscriber.lastPortalLoginAt = new Date();
    await this.subscriberRepo.save(subscriber);

    const payload: PortalJwtPayload = {
      sub: subscriber.id,
      merchantId: subscriber.merchantId,
      email: subscriber.email,
      type: 'subscriber_portal',
    };

    const portalToken = this.jwtService.sign(payload, { expiresIn: '8h' });

    return {
      portalToken,
      subscriber: {
        id: subscriber.id,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        email: subscriber.email,
        merchantId: subscriber.merchantId,
      },
    };
  }

  /**
   * Get merchant by businessName slug or ID for portal scoping
   */
  async getMerchantBySlug(slug: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.findOne({
      where: { id: slug },
    });
    if (!merchant) throw new NotFoundException('Merchant portal not found');
    return merchant;
  }
}
