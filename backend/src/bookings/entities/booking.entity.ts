import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Driver } from '../../database/entities/driver.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.bookings, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Driver, (driver) => driver.bookings, { nullable: true, eager: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({ nullable: true })
  driverId: string;

  // Pickup
  @Column()
  pickupAddress: string;

  @Column('decimal', { precision: 10, scale: 7 })
  pickupLat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  pickupLng: number;

  // Dropoff
  @Column()
  dropoffAddress: string;

  @Column('decimal', { precision: 10, scale: 7 })
  dropoffLat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  dropoffLng: number;

  // Trip details
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  distanceKm: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimatedFare: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  finalFare: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ nullable: true })
  passengerCount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
