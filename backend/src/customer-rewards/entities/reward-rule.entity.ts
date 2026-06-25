import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RuleTriggerType {
  EVERY_N_TRIPS = 'every_n_trips',     // e.g. every 5th trip
  TRIP_MILESTONE = 'trip_milestone',    // e.g. 10th trip total
  FIRST_TRIP = 'first_trip',
}

export enum RuleRewardType {
  POINTS = 'points',
  COUPON = 'coupon',
  BOTH = 'both',
}

@Entity('reward_rules')
export class RewardRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g. "جایزه هر ۵ سفر"

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: RuleTriggerType, name: 'trigger_type' })
  triggerType: RuleTriggerType;

  @Column({ name: 'trigger_value', nullable: true })
  triggerValue: number; // N for every_n_trips, or milestone number

  @Column({ type: 'enum', enum: RuleRewardType, name: 'reward_type' })
  rewardType: RuleRewardType;

  // Points config
  @Column({ name: 'points_amount', nullable: true })
  pointsAmount: number;

  // Coupon config
  @Column({ name: 'coupon_discount_percent', nullable: true, type: 'decimal', precision: 5, scale: 2 })
  couponDiscountPercent: number;

  @Column({ name: 'coupon_max_discount', nullable: true })
  couponMaxDiscount: number; // max toman discount cap

  @Column({ name: 'coupon_validity_days', default: 30 })
  couponValidityDays: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
