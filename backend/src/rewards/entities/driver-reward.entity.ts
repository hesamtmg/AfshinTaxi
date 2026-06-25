import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

export enum RewardType {
  TRIP_MILESTONE = 'trip_milestone',
  HIGH_RATING = 'high_rating',
  MONTHLY_TOP = 'monthly_top',
  CUSTOM = 'custom',
}

export enum RewardStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('driver_rewards')
export class DriverReward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'driver_id' })
  driverId: number;

  @Column({ type: 'enum', enum: RewardType })
  type: RewardType;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string; // emoji or icon name

  @Column({ type: 'enum', enum: RewardStatus, default: RewardStatus.PENDING_APPROVAL })
  status: RewardStatus;

  @Column({ name: 'awarded_at', nullable: true })
  awardedAt: Date;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: number; // admin user id

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'admin_note', nullable: true })
  adminNote: string;

  @Column({ name: 'milestone_value', nullable: true })
  milestoneValue: number; // e.g. 50 for 50-trip milestone

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
