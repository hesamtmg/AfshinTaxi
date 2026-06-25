import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customer_points')
export class CustomerPoints {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id', unique: true })
  customerId: number;

  @Column({ default: 0 })
  balance: number; // total usable points

  @Column({ name: 'total_earned', default: 0 })
  totalEarned: number;

  @Column({ name: 'total_spent', default: 0 })
  totalSpent: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
