import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { Subscription } from '../subscribers/entities/subscription.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async create(merchantId: string, dto: CreatePlanDto): Promise<Plan> {
    // Check for duplicate code within the same merchant
    const existing = await this.planRepo.findOne({
      where: { merchantId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `A plan with code '${dto.code}' already exists.`,
      );
    }

    const plan = this.planRepo.create({
      ...dto,
      merchantId,
    });

    return this.planRepo.save(plan);
  }

  async findAll(merchantId: string): Promise<Plan[]> {
    return this.planRepo.find({
      where: { merchantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(merchantId: string, id: string): Promise<Plan> {
    const plan = await this.planRepo.findOne({
      where: { id, merchantId, deletedAt: IsNull() },
    });
    if (!plan) {
      throw new NotFoundException(`Plan with ID '${id}' not found.`);
    }
    return plan;
  }

  async update(
    merchantId: string,
    id: string,
    dto: UpdatePlanDto,
  ): Promise<Plan> {
    const plan = await this.findOne(merchantId, id);

    // If setting as default, unset other defaults for this merchant
    if (dto.isDefault) {
      await this.planRepo.update(
        { merchantId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async remove(merchantId: string, id: string): Promise<void> {
    const plan = await this.findOne(merchantId, id);

    // Check if plan is attached to any subscription belonging to a non-deleted subscriber
    const subCount = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .innerJoin('subscription.subscriber', 'subscriber')
      .where('subscription.planId = :planId', { planId: id })
      .andWhere('subscriber.deletedAt IS NULL')
      .getCount();
    if (subCount > 0) {
      throw new ConflictException(
        'Cannot delete plan because it is attached to one or more subscribers.',
      );
    }

    // Soft delete
    plan.deletedAt = new Date();
    await this.planRepo.save(plan);
  }
}
