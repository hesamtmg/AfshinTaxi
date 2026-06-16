import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Driver, DriverStatus } from '../database/entities/driver.entity';
import { SettingsService } from '../settings/settings.service';
import { SmsService } from '../sms/sms.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    private readonly settingsService: SettingsService,
    private readonly smsService: SmsService,
  ) {}

  // ─── Client: Create booking ──────────────────────────────────────────────────
  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const farePerKm = await this.settingsService.getFarePerKm();
    const estimatedFare = parseFloat((dto.distanceKm * farePerKm).toFixed(2));

    const booking = this.bookingRepo.create({
      ...dto,
      userId,
      estimatedFare,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepo.save(booking);
  }

  // ─── Client: My bookings ─────────────────────────────────────────────────────
  async findMyBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Client: Get single booking ──────────────────────────────────────────────
  async findOne(id: string, userId?: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (userId && booking.userId !== userId) throw new ForbiddenException();
    return booking;
  }

  // ─── Client: Cancel booking ──────────────────────────────────────────────────
  async cancel(id: string, userId: string, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id, userId);

    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('Cannot cancel this booking');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason;
    return this.bookingRepo.save(booking);
  }

  // ─── Admin: All bookings ─────────────────────────────────────────────────────
  async findAll(filters?: { status?: BookingStatus; date?: string }): Promise<Booking[]> {
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.driver', 'driver')
      .orderBy('booking.createdAt', 'DESC');

    if (filters?.status) {
      qb.andWhere('booking.status = :status', { status: filters.status });
    }

    return qb.getMany();
  }

  // ─── Admin: Assign driver ────────────────────────────────────────────────────
  async assignDriver(bookingId: string, dto: AssignDriverDto): Promise<Booking> {
    const booking = await this.findOne(bookingId);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot assign driver to cancelled booking');
    }

    const driver = await this.driverRepo.findOne({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.status !== DriverStatus.ACTIVE) {
      throw new BadRequestException('Driver is not active');
    }

    booking.driverId = dto.driverId;
    booking.status = BookingStatus.CONFIRMED;
    if (dto.finalFare) booking.finalFare = dto.finalFare;

    const saved = await this.bookingRepo.save(booking);

    // Notify client via SMS
    await this.smsService.sendBookingConfirmation(
      booking.user.phone,
      driver.fullName,
      driver.carModel,
      driver.carPlate,
      booking.scheduledAt,
    );

    return saved;
  }

  // ─── Admin: Update status ────────────────────────────────────────────────────
  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = status;
    return this.bookingRepo.save(booking);
  }

  // ─── Admin: Stats ────────────────────────────────────────────────────────────
  async getStats() {
    const total = await this.bookingRepo.count();
    const pending = await this.bookingRepo.count({ where: { status: BookingStatus.PENDING } });
    const confirmed = await this.bookingRepo.count({ where: { status: BookingStatus.CONFIRMED } });
    const completed = await this.bookingRepo.count({ where: { status: BookingStatus.COMPLETED } });
    const cancelled = await this.bookingRepo.count({ where: { status: BookingStatus.CANCELLED } });

    const revenueResult = await this.bookingRepo
      .createQueryBuilder('b')
      .select('SUM(b.finalFare)', 'total')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    return {
      total, pending, confirmed, completed, cancelled,
      totalRevenue: parseFloat(revenueResult?.total || '0'),
    };
  }
}
