import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DriverReward, RewardType, RewardStatus } from './entities/driver-reward.entity';

// Milestone definitions
const TRIP_MILESTONES = [
  { count: 50, title: 'راننده فعال', description: 'تکمیل ۵۰ سفر موفق', icon: '🥉', value: 50 },
  { count: 100, title: 'راننده حرفه‌ای', description: 'تکمیل ۱۰۰ سفر موفق', icon: '🥈', value: 100 },
  { count: 200, title: 'راننده طلایی', description: 'تکمیل ۲۰۰ سفر موفق', icon: '🥇', value: 200 },
  { count: 500, title: 'راننده افسانه‌ای', description: 'تکمیل ۵۰۰ سفر موفق', icon: '🏆', value: 500 },
];

const HIGH_RATING_THRESHOLD = 4.8;
const HIGH_RATING_MIN_TRIPS = 20; // minimum trips to qualify

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(DriverReward)
    private rewardRepo: Repository<DriverReward>,
    private dataSource: DataSource,
  ) {}

  // Called after each trip completion to check for new rewards
  async checkAndCreateRewards(driverId: number): Promise<void> {
    await this.checkTripMilestones(driverId);
    await this.checkHighRating(driverId);
  }

  private async checkTripMilestones(driverId: number): Promise<void> {
    // Count completed trips for driver
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE driver_id = $1 AND status = 'completed'`,
      [driverId],
    );
    const tripCount = parseInt(result[0]?.count || '0');

    for (const milestone of TRIP_MILESTONES) {
      if (tripCount >= milestone.count) {
        // Check if reward already exists (any status)
        const existing = await this.rewardRepo.findOne({
          where: {
            driverId,
            type: RewardType.TRIP_MILESTONE,
            milestoneValue: milestone.value,
          },
        });
        if (!existing) {
          await this.rewardRepo.save(
            this.rewardRepo.create({
              driverId,
              type: RewardType.TRIP_MILESTONE,
              title: milestone.title,
              description: milestone.description,
              icon: milestone.icon,
              milestoneValue: milestone.value,
              status: RewardStatus.PENDING_APPROVAL,
            }),
          );
        }
      }
    }
  }

  private async checkHighRating(driverId: number): Promise<void> {
    const result = await this.dataSource.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count 
       FROM bookings 
       WHERE driver_id = $1 AND status = 'completed' AND rating IS NOT NULL`,
      [driverId],
    );
    const avgRating = parseFloat(result[0]?.avg_rating || '0');
    const tripCount = parseInt(result[0]?.count || '0');

    if (avgRating >= HIGH_RATING_THRESHOLD && tripCount >= HIGH_RATING_MIN_TRIPS) {
      const existing = await this.rewardRepo.findOne({
        where: { driverId, type: RewardType.HIGH_RATING },
      });
      if (!existing) {
        await this.rewardRepo.save(
          this.rewardRepo.create({
            driverId,
            type: RewardType.HIGH_RATING,
            title: 'راننده ممتاز',
            description: `میانگین امتیاز ${avgRating.toFixed(1)} از ۵`,
            icon: '⭐',
            status: RewardStatus.PENDING_APPROVAL,
          }),
        );
      }
    }
  }

  // Admin: run monthly top driver check (call via cron or manual trigger)
  async checkMonthlyTopDriver(): Promise<void> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const results = await this.dataSource.query(
      `SELECT driver_id, COUNT(*) as trip_count, AVG(rating) as avg_rating
       FROM bookings
       WHERE status = 'completed'
         AND completed_at >= $1 AND completed_at <= $2
         AND driver_id IS NOT NULL
       GROUP BY driver_id
       ORDER BY trip_count DESC, avg_rating DESC
       LIMIT 1`,
      [firstDay, lastDay],
    );

    if (!results.length) return;

    const topDriver = results[0];
    const monthLabel = firstDay.toLocaleString('fa-IR', { month: 'long', year: 'numeric' });

    const existing = await this.rewardRepo.findOne({
      where: {
        driverId: topDriver.driver_id,
        type: RewardType.MONTHLY_TOP,
        description: monthLabel,
      },
    });

    if (!existing) {
      await this.rewardRepo.save(
        this.rewardRepo.create({
          driverId: topDriver.driver_id,
          type: RewardType.MONTHLY_TOP,
          title: 'بهترین راننده ماه',
          description: monthLabel,
          icon: '🏅',
          status: RewardStatus.PENDING_APPROVAL,
        }),
      );
    }
  }

  // Admin: create custom reward
  async createCustomReward(dto: {
    driverId: number;
    title: string;
    description?: string;
    icon?: string;
  }): Promise<DriverReward> {
    return this.rewardRepo.save(
      this.rewardRepo.create({
        driverId: dto.driverId,
        type: RewardType.CUSTOM,
        title: dto.title,
        description: dto.description,
        icon: dto.icon || '🎖️',
        status: RewardStatus.PENDING_APPROVAL,
      }),
    );
  }

  // Admin: list all pending rewards
  async getPendingRewards(): Promise<DriverReward[]> {
    return this.rewardRepo.find({
      where: { status: RewardStatus.PENDING_APPROVAL },
      order: { createdAt: 'ASC' },
    });
  }

  // Admin: list all rewards with optional filters
  async getAllRewards(status?: RewardStatus): Promise<DriverReward[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.rewardRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // Admin: approve reward
  async approveReward(id: number, adminId: number, note?: string): Promise<DriverReward> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('جایزه یافت نشد');

    reward.status = RewardStatus.APPROVED;
    reward.reviewedBy = adminId;
    reward.reviewedAt = new Date();
    reward.awardedAt = new Date();
    if (note) reward.adminNote = note;

    return this.rewardRepo.save(reward);
  }

  // Admin: reject reward
  async rejectReward(id: number, adminId: number, note?: string): Promise<DriverReward> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('جایزه یافت نشد');

    reward.status = RewardStatus.REJECTED;
    reward.reviewedBy = adminId;
    reward.reviewedAt = new Date();
    if (note) reward.adminNote = note;

    return this.rewardRepo.save(reward);
  }

  // Driver: get own approved badges
  async getDriverBadges(driverId: number): Promise<DriverReward[]> {
    return this.rewardRepo.find({
      where: { driverId, status: RewardStatus.APPROVED },
      order: { awardedAt: 'DESC' },
    });
  }

  // Admin: get rewards for a specific driver
  async getDriverRewardsAdmin(driverId: number): Promise<DriverReward[]> {
    return this.rewardRepo.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });
  }
}
