import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Subscriber } from './entities/subscriber.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { hashEmail } from '../../common/utils/security.utils';

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
export class PortalAuthService implements OnModuleInit {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Automatically backfills emailHash for legacy/existing subscribers on boot.
   */
  async onModuleInit() {
    try {
      const subscribers = await this.subscriberRepo.find({
        where: { emailHash: IsNull() },
      });
      if (subscribers.length > 0) {
        for (const sub of subscribers) {
          try {
            sub.emailHash = hashEmail(sub.email.toLowerCase().trim());
            await this.subscriberRepo.save(sub);
          } catch (singleErr: any) {
            // Delete duplicate legacy row that violates unique constraints to clean up the DB
            if (singleErr.message?.includes('duplicate key') || singleErr.detail?.includes('already exists')) {
              await this.subscriberRepo.delete(sub.id);
            }
          }
        }
      }
    } catch (err: any) {
      // Gracefully catch database errors on initialization if schema has not migrated yet
    }
  }

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
   * Login subscriber with email + password.
   * If merchantId is provided, scopes login directly.
   * If merchantId is omitted, looks up all businesses the email is subscribed to.
   */
  async loginSubscriber(
    merchantId: string | undefined,
    email: string,
    password: string,
  ): Promise<any> {
    const hashedEmail = hashEmail(email.toLowerCase().trim());

    if (merchantId) {
      const subscriber = await this.subscriberRepo.findOne({
        where: { merchantId, emailHash: hashedEmail },
        relations: { merchant: true },
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

    // Unscoped login: Look up all subscriber records matching emailHash
    const subscribers = await this.subscriberRepo.find({
      where: { emailHash: hashedEmail },
      relations: { merchant: true },
    });

    if (subscribers.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify passwords for all subscriber records matching the email
    const validSubscribers: Subscriber[] = [];
    for (const sub of subscribers) {
      if (sub.portalPasswordHash) {
        const isValid = await bcrypt.compare(password, sub.portalPasswordHash);
        if (isValid) {
          validSubscribers.push(sub);
        }
      }
    }

    if (validSubscribers.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If there is exactly one valid subscriber record, log them in immediately
    if (validSubscribers.length === 1) {
      const subscriber = validSubscribers[0];
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

    // If there are multiple valid subscriber records (multiple merchant portals)
    // Return a list of portals so the user can choose which to enter
    const merchants = validSubscribers.map(sub => {
      const settings = sub.merchant?.settings as Record<string, unknown> | undefined;
      return {
        id: sub.merchant.id,
        businessName: sub.merchant.businessName,
        logoUrl: typeof settings?.logoUrl === 'string' ? settings.logoUrl : null,
        brandColor: typeof settings?.brandColor === 'string' ? settings.brandColor : '#7c3aed',
      };
    });

    return {
      multipleMerchants: true,
      merchants,
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
