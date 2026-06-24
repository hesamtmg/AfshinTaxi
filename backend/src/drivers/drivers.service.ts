import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Driver } from '../database/entities/driver.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  // ─── Admin: CRUD ─────────────────────────────────────────────────────────────
  create(dto: any): Promise<Driver[]> {
    return this.driverRepo.save(this.driverRepo.create(dto));
  }

  findAll(status?: string): Promise<Driver[]> {
    const where: any = status ? { status } : {};
    return this.driverRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async update(id: string, dto: any): Promise<Driver> {
    const driver = await this.findOne(id);
    Object.assign(driver, dto);
    return this.driverRepo.save(driver);
  }

  async updateStatus(id: string, status: string): Promise<Driver> {
    const driver = await this.findOne(id);
    (driver as any).status = status;
    return this.driverRepo.save(driver);
  }

  async remove(id: string): Promise<void> {
    await this.driverRepo.remove(await this.findOne(id));
  }

  // ─── Driver Auth: Step 1 — Send OTP ──────────────────────────────────────
  async sendOtp(phone: string): Promise<{ message: string }> {
    const driver = await this.driverRepo.findOne({ where: { phone } });
    if (!driver) throw new UnauthorizedException('Phone number not registered as a driver');
    if ((driver as any).status === 'suspended') throw new UnauthorizedException('Your account has been suspended');

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    (driver as any).otpCode = await bcrypt.hash(otp, 8);
    (driver as any).otpExpiresAt = otpExpiresAt;
    await this.driverRepo.save(driver);

    await this.smsService.sendOtp(phone, otp);

    return { message: 'OTP sent to your phone number' };
  }

  // ─── Driver Auth: Step 2 — Verify OTP ────────────────────────────────────
  async verifyOtp(phone: string, otp: string): Promise<{ token: string; driver: any }> {
    const driver = await this.driverRepo.findOne({
      where: { phone },
      select: ['id','avatarUrl', 'fullName', 'phone', 'email', 'status', 'carModel', 'carPlate', 'carColor', 'carYear', 'licenseNumber', 'otpCode', 'otpExpiresAt'] as any,
    });

    if (!driver) throw new NotFoundException('Driver not found');
    if (!(driver as any).otpCode) throw new BadRequestException('No OTP requested. Please request a new code.');
    if (new Date() > (driver as any).otpExpiresAt) throw new BadRequestException('OTP has expired. Please request a new code.');

    // const isMatch = await bcrypt.compare(otp, (driver as any).otpCode);
    // if (!isMatch) throw new BadRequestException('Invalid OTP code');

    // Clear OTP
    (driver as any).otpCode = null;
    (driver as any).otpExpiresAt = null;
    await this.driverRepo.save(driver);

    const token = this.jwtService.sign({ sub: driver.id, role: 'driver' });

    const { otpCode, otpExpiresAt, ...safeDriver } = driver as any;
    return { token, driver: safeDriver };
  }

  // ─── Driver: My trips ─────────────────────────────────────────────────────
  async getMyTrips(driverId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { driverId },
      order: { scheduledAt: 'DESC' },
      relations: ['user'],
    });
  }

  async getMyTrip(driverId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, driverId },
      relations: ['user'],
    });
    if (!booking) throw new NotFoundException('Trip not found');
    return booking;
  }

  async getMyStats(driverId: string) {
    const trips = await this.getMyTrips(driverId);
    const completed = trips.filter((t) => t.status === BookingStatus.COMPLETED);
    const upcoming  = trips.filter((t) => [BookingStatus.CONFIRMED, BookingStatus.PENDING].includes(t.status));
    const totalEarnings = completed.reduce((sum, t) => sum + parseFloat((t.finalFare || t.estimatedFare || 0) as any), 0);
    return {
      total: trips.length,
      completed: completed.length,
      upcoming: upcoming.length,
      inProgress: trips.filter((t) => t.status === BookingStatus.IN_PROGRESS).length,
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  // ─── Driver: Update own trip status ─────────────────────────────────────────
  // Driver can only:
  //   confirmed   → in_progress  (سوار کردن مسافر)
  //   in_progress → completed    (رسیدن به مقصد)
  async updateTripStatus(
    driverId: string,
    bookingId: string,
    status: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, driverId },
    });

    if (!booking) {
      throw new NotFoundException('این سفر برای شما یافت نشد');
    }

    const allowed: Record<string, string> = {
      confirmed:   'in_progress',
      in_progress: 'completed',
    };

    if (allowed[booking.status] !== status) {
      throw new BadRequestException(
        `تغییر وضعیت از ${booking.status} به ${status} مجاز نیست`,
      );
    }

    (booking as any).status = status;
    return this.bookingRepo.save(booking);
  }
}

  
