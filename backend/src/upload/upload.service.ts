import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { User } from '../database/entities/user.entity';
import { Driver } from '../database/entities/driver.entity';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
  ) {}

  // ── Customer avatar ────────────────────────────────────────────────────────
  async updateUserAvatar(userId: string, filename: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    // Delete old avatar if exists
    if ((user as any).avatarUrl) {
      this.deleteFile((user as any).avatarUrl);
    }

    (user as any).avatarUrl = `/uploads/${filename}`;
    return this.userRepo.save(user);
  }

  // ── Driver avatar ──────────────────────────────────────────────────────────
  async updateDriverAvatar(driverId: string, filename: string): Promise<Driver> {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('راننده یافت نشد');

    if (driver.avatarUrl) {
      this.deleteFile(driver.avatarUrl);
    }

    driver.avatarUrl = `/uploads/${filename}`;
    return this.driverRepo.save(driver);
  }
    // ── Delete Avatar from disk ──────────────────────────────────────────────
  async deleteDriverAvatar(driverId: string): Promise<Driver> {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    console.log('hesam',driver)
    if (!driver) throw new NotFoundException('راننده یافت نشد');

    if (driver.avatarUrl) {
      this.deleteFile(driver.avatarUrl);
    }

    driver.avatarUrl = '';
    return this.driverRepo.save(driver);
  }

  // ── Delete old file from disk ──────────────────────────────────────────────
  private deleteFile(avatarUrl: string) {
    try {
      const filename = avatarUrl.replace('/uploads/', '');
      const filepath = join(process.cwd(), 'uploads', filename);
      if (existsSync(filepath)) unlinkSync(filepath);
    } catch {}
  }
}
