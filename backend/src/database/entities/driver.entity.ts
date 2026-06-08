import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.ACTIVE })
  status: DriverStatus;

  // Vehicle info
  @Column()
  carModel: string;

  @Column()
  carPlate: string;

  @Column({ nullable: true })
  carColor: string;

  @Column({ nullable: true })
  carYear: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(() => Booking, (booking) => booking.driver)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
