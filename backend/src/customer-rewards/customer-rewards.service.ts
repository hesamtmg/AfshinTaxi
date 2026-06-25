import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RewardRule, RuleTriggerType, RuleRewardType } from './entities/reward-rule.entity';
import { CustomerReward, CustomerRewardStatus, CustomerRewardType } from './entities/customer-reward.entity';
import { CustomerPoints } from './entities/customer-points.entity';

@Injectable()
export class CustomerRewardsService {
  constructor(
    @InjectRepository(RewardRule)
    private ruleRepo: Repository<RewardRule>,
    @InjectRepository(CustomerReward)
    private rewardRepo: Repository<CustomerReward>,
    @InjectRepository(CustomerPoints)
    private pointsRepo: Repository<CustomerPoints>,
    private dataSource: DataSource,
  ) {}

  // ── Called after every completed booking ───────────────────────

  async checkAndCreateRewards(customerId: number, bookingId: number): Promise<void> {
    const rules = await this.ruleRepo.find({ where: { isActive: true } });
    if (!rules.length) return;

    const tripCount = await this.getCustomerTripCount(customerId);

    for (const rule of rules) {
      const triggered = this.isRuleTriggered(rule, tripCount);
      if (!triggered) continue;

      // Avoid duplicate rewards for same booking + rule
      const exists = await this.rewardRepo.findOne({
        where: { customerId, bookingId, ruleId: rule.id },
      });
      if (exists) continue;

      await this.createRewardsForRule(rule, customerId, bookingId);
    }
  }

  private isRuleTriggered(rule: RewardRule, tripCount: number): boolean {
    switch (rule.triggerType) {
      case RuleTriggerType.FIRST_TRIP:
        return tripCount === 1;
      case RuleTriggerType.TRIP_MILESTONE:
        return tripCount === rule.triggerValue;
      case RuleTriggerType.EVERY_N_TRIPS:
        return rule.triggerValue > 0 && tripCount % rule.triggerValue === 0;
      default:
        return false;
    }
  }

  private async createRewardsForRule(
    rule: RewardRule,
    customerId: number,
    bookingId: number,
  ): Promise<void> {
    if (rule.rewardType === RuleRewardType.POINTS || rule.rewardType === RuleRewardType.BOTH) {
      await this.rewardRepo.save(
        this.rewardRepo.create({
          customerId,
          bookingId,
          ruleId: rule.id,
          type: CustomerRewardType.POINTS,
          status: CustomerRewardStatus.PENDING_APPROVAL,
          pointsAmount: rule.pointsAmount,
        }),
      );
    }

    if (rule.rewardType === RuleRewardType.COUPON || rule.rewardType === RuleRewardType.BOTH) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (rule.couponValidityDays || 30));

      await this.rewardRepo.save(
        this.rewardRepo.create({
          customerId,
          bookingId,
          ruleId: rule.id,
          type: CustomerRewardType.COUPON,
          status: CustomerRewardStatus.PENDING_APPROVAL,
          couponCode: this.generateCouponCode(),
          couponDiscountPercent: rule.couponDiscountPercent,
          couponMaxDiscount: rule.couponMaxDiscount,
          couponExpiresAt: expiresAt,
        }),
      );
    }
  }

  private generateCouponCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'AT-';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private async getCustomerTripCount(customerId: number): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE customer_id = $1 AND status = 'completed'`,
      [customerId],
    );
    return parseInt(result[0]?.count || '0');
  }

  // ── Admin: Rules CRUD ──────────────────────────────────────────

  async createRule(dto: Partial<RewardRule>): Promise<RewardRule> {
    return this.ruleRepo.save(this.ruleRepo.create(dto));
  }

  async updateRule(id: number, dto: Partial<RewardRule>): Promise<RewardRule> {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('قانون یافت نشد');
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async deleteRule(id: number): Promise<void> {
    await this.ruleRepo.delete(id);
  }

  async getAllRules(): Promise<RewardRule[]> {
    return this.ruleRepo.find({ order: { createdAt: 'ASC' } });
  }

  // ── Admin: Customer rewards approval ──────────────────────────

  async getPendingRewards(): Promise<CustomerReward[]> {
    return this.rewardRepo.find({
      where: { status: CustomerRewardStatus.PENDING_APPROVAL },
      order: { createdAt: 'ASC' },
    });
  }

  async getAllRewards(status?: CustomerRewardStatus): Promise<CustomerReward[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.rewardRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async approveReward(id: number, adminId: number, note?: string): Promise<CustomerReward> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('جایزه یافت نشد');
    if (reward.status !== CustomerRewardStatus.PENDING_APPROVAL) {
      throw new BadRequestException('این جایزه قبلاً بررسی شده است');
    }

    reward.status = CustomerRewardStatus.APPROVED;
    reward.reviewedBy = adminId;
    reward.reviewedAt = new Date();
    reward.creditedAt = new Date();
    if (note) reward.adminNote = note;

    const saved = await this.rewardRepo.save(reward);

    // If points reward → credit customer's wallet
    if (reward.type === CustomerRewardType.POINTS && reward.pointsAmount) {
      await this.creditPoints(reward.customerId, reward.pointsAmount);
    }

    return saved;
  }

  async rejectReward(id: number, adminId: number, note?: string): Promise<CustomerReward> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('جایزه یافت نشد');

    reward.status = CustomerRewardStatus.REJECTED;
    reward.reviewedBy = adminId;
    reward.reviewedAt = new Date();
    if (note) reward.adminNote = note;

    return this.rewardRepo.save(reward);
  }

  // ── Points wallet ──────────────────────────────────────────────

  async creditPoints(customerId: number, amount: number): Promise<CustomerPoints> {
    let wallet = await this.pointsRepo.findOne({ where: { customerId } });
    if (!wallet) {
      wallet = this.pointsRepo.create({ customerId, balance: 0, totalEarned: 0, totalSpent: 0 });
    }
    wallet.balance += amount;
    wallet.totalEarned += amount;
    return this.pointsRepo.save(wallet);
  }

  async getCustomerWallet(customerId: number): Promise<CustomerPoints> {
    let wallet = await this.pointsRepo.findOne({ where: { customerId } });
    if (!wallet) {
      wallet = this.pointsRepo.create({ customerId, balance: 0, totalEarned: 0, totalSpent: 0 });
      await this.pointsRepo.save(wallet);
    }
    return wallet;
  }

  // ── Customer: own rewards ──────────────────────────────────────

  async getCustomerRewards(customerId: number): Promise<{
    wallet: CustomerPoints;
    coupons: CustomerReward[];
    pendingCount: number;
  }> {
    const wallet = await this.getCustomerWallet(customerId);

    const allRewards = await this.rewardRepo.find({ where: { customerId } });

    const coupons = allRewards.filter(
      (r) =>
        r.type === CustomerRewardType.COUPON &&
        r.status === CustomerRewardStatus.APPROVED &&
        !r.couponUsed &&
        (!r.couponExpiresAt || r.couponExpiresAt > new Date()),
    );

    const pendingCount = allRewards.filter(
      (r) => r.status === CustomerRewardStatus.PENDING_APPROVAL,
    ).length;

    return { wallet, coupons, pendingCount };
  }

  // Validate + mark a coupon as used (call at booking payment)
  async useCoupon(
    couponCode: string,
    customerId: number,
    bookingFare: number,
  ): Promise<{ discountAmount: number; coupon: CustomerReward }> {
    const coupon = await this.rewardRepo.findOne({
      where: {
        couponCode,
        customerId,
        status: CustomerRewardStatus.APPROVED,
        couponUsed: false,
      },
    });

    if (!coupon) throw new NotFoundException('کد تخفیف نامعتبر یا استفاده‌شده است');
    if (coupon.couponExpiresAt && coupon.couponExpiresAt < new Date()) {
      throw new BadRequestException('کد تخفیف منقضی شده است');
    }

    const discountPercent = Number(coupon.couponDiscountPercent) / 100;
    let discountAmount = Math.round(bookingFare * discountPercent);
    if (coupon.couponMaxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.couponMaxDiscount);
    }

    coupon.couponUsed = true;
    coupon.couponUsedAt = new Date();
    await this.rewardRepo.save(coupon);

    return { discountAmount, coupon };
  }
}
