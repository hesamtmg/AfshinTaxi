import { Booking } from '../../bookings/entities/booking.entity';
import { Driver } from '../../database/entities/driver.entity';
import { User } from '../../database/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn
} from 'typeorm';

@Entity('trip_ratings')
export class TripRating {
  @PrimaryGeneratedColumn()
  id: string;

  @OneToOne(() => Booking, (booking) => booking.id)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ name: 'user_id' })
  userId: string;


  @ManyToOne(() => Driver, (driver) => driver.id)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;
  @Column({ name: 'driver_id' })
  driverId: string;

  @Column({ type: 'smallint' })
  stars: number; // 1–5

  @Column({ nullable: true })
  comment: string;

  // Admin control
  @Column({ name: 'is_visible', default: true })
  isVisible: boolean; // admin can hide inappropriate ratings

  @Column({ name: 'admin_note', nullable: true })
  adminNote: string;

  @Column({ name: 'hidden_by', nullable: true })
  hiddenBy: string;

  @Column({ name: 'hidden_at', nullable: true })
  hiddenAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
