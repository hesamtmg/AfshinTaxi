import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerRewardStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum CustomerRewardType {
  POINTS = 'points',
  COUPON = 'coupon',
}

@Entity('customer_rewards')
export class CustomerReward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ name: 'booking_id' })
  bookingId: number; // the trip that triggered this reward

  @Column({ name: 'rule_id', nullable: true })
  ruleId: number;

  @Column({ type: 'enum', enum: CustomerRewardType })
  type: CustomerRewardType;

  @Column({ type: 'enum', enum: CustomerRewardStatus, default: CustomerRewardStatus.PENDING_APPROVAL })
  status: CustomerRewardStatus;

  // Points reward fields
  @Column({ name: 'points_amount', nullable: true })
  pointsAmount: number;

  // Coupon reward fields
  @Column({ name: 'coupon_code', nullable: true, unique: true })
  couponCode: string;

  @Column({ name: 'coupon_discount_percent', nullable: true, type: 'decimal', precision: 5, scale: 2 })
  couponDiscountPercent: number;

  @Column({ name: 'coupon_max_discount', nullable: true })
  couponMaxDiscount: number;

  @Column({ name: 'coupon_expires_at', nullable: true })
  couponExpiresAt: Date;

  @Column({ name: 'coupon_used', default: false })
  couponUsed: boolean;

  @Column({ name: 'coupon_used_at', nullable: true })
  couponUsedAt: Date;

  // Admin review
  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: number;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'admin_note', nullable: true })
  adminNote: string;

  // Points credited timestamp (set when approved)
  @Column({ name: 'credited_at', nullable: true })
  creditedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
