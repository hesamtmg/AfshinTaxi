import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Driver, DriverStatus } from '../database/entities/driver.entity';
import { SettingsService } from '../settings/settings.service';
import { SmsService } from '../sms/sms.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EditBookingDto } from './dto/edit-booking.dto';
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
  ) { }
  async getPublicStatus(id: string): Promise<any> {
    const booking = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.driver', 'driver')
      .where('booking.id = :id', { id })
      .getOne();



    if (!booking) throw new NotFoundException('رزرو یافت نشد');

    // Return only what a guest needs to see — no personal user data
    return {
      id: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      distanceKm: booking.distanceKm,
      estimatedFare: booking.estimatedFare,
      finalFare: booking.finalFare,
      passengerCount: booking.passengerCount,
      createdAt: booking.createdAt,
      pickupLat: booking.pickupLat,
      pickupLng: booking.pickupLng,
      dropoffLat: booking.dropoffLat,
      dropoffLng: booking.dropoffLng,
      driver: booking.driver ? {
        fullName: booking.driver.fullName,
        carModel: booking.driver.carModel,
        carPlate: booking.driver.carPlate,
        carColor: booking.driver.carColor,
        avatarUrl: booking.driver.avatarUrl,
      } : null,
    };
  }
  // ─── Client: Create booking ──────────────────────────────────────────────────
  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const farePerKm = await this.settingsService.getFarePerKm();
    const baseFare = parseFloat((await this.settingsService.get('base_fare')) || '0');
    const minFare = parseFloat((await this.settingsService.get('minimum_fare')) || '0');

    const distanceFare = dto.distanceKm * farePerKm;
    const calculatedFare = Math.max(baseFare + distanceFare, minFare);
    const estimatedFare = parseFloat(calculatedFare.toFixed(2));

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
    return this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.driver', 'driver')
      .where('booking.userId = :userId', { userId })
      .orderBy('booking.createdAt', 'DESC')
      .getMany();
  }

  // ─── Client: Get single booking ──────────────────────────────────────────────
  async findOne(id: string, userId?: string): Promise<Booking> {
    const booking = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.driver', 'driver')
      .where('booking.id = :id', { id })
      .getOne();

    if (!booking) throw new NotFoundException('Booking not found');
    if (userId && booking.userId !== userId) throw new ForbiddenException();
    return booking;
  }

  // ─── Client: Cancel booking ──────────────────────────────────────────────────
  async cancel(id: string, userId: string, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id, userId);

    // Check status
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('This booking cannot be cancelled');
    }

    // ── Feature 2: Cancellation deadline check ────────────────────────────────
    const deadlineMinutes = await this.settingsService.getCancellationDeadlineMinutes();

    if (deadlineMinutes > 0) {
      const scheduledTime = new Date(booking.scheduledAt).getTime();
      const now = Date.now();
      const minutesUntilTrip = (scheduledTime - now) / (1000 * 60);

      if (minutesUntilTrip < deadlineMinutes) {
        throw new BadRequestException(
          `Cancellation is not allowed within ${deadlineMinutes} minutes of the scheduled pickup time. ` +
          `Your trip is in ${Math.round(minutesUntilTrip)} minutes.`,
        );
      }
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason;
    return this.bookingRepo.save(booking);
  }

  // ─── Admin: All bookings ─────────────────────────────────────────────────────
  async findAll(filters?: { status?: BookingStatus }): Promise<Booking[]> {
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
      throw new BadRequestException('Cannot assign driver to a cancelled booking');
    }

    const driver = await this.driverRepo.findOne({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.status !== DriverStatus.ACTIVE) {
      throw new BadRequestException('Driver is not active');
    }

    // ── Feature 3: Driver availability check ──────────────────────────────────
    const conflict = await this.checkDriverAvailability(
      dto.driverId,
      booking.scheduledAt,
      bookingId, // exclude current booking from check
    );

    if (conflict) {
      const conflictTime = new Date(conflict.scheduledAt).toLocaleString();
      throw new BadRequestException(
        `Driver already has a booking on ${conflictTime} ` +
        `(#${conflict.id.slice(0, 8).toUpperCase()}) ` +
        `that conflicts with this time slot.`,
      );
    }

    booking.driverId = dto.driverId;
    booking.status = BookingStatus.CONFIRMED;
    if (dto.finalFare) booking.finalFare = dto.finalFare;

    const saved = await this.bookingRepo.save(booking);

    // Notify client via SMS
    try {
      await this.smsService.sendBookingConfirmation(
        booking.user.phone,
        driver.fullName,
        driver.carModel,
        driver.carPlate,
        booking.scheduledAt,
        saved.finalFare || saved.estimatedFare,
      );
    } catch (e) {
      // Don't fail the whole request if SMS fails
      console.error('SMS notification failed:', e);
    }

    return saved;
  }

  // ─── Feature 3: Check driver availability ────────────────────────────────────
  // Returns the conflicting booking if the driver is busy, null if free
  private async checkDriverAvailability(
    driverId: string,
    scheduledAt: Date,
    excludeBookingId?: string,
  ): Promise<Booking | null> {
    const bufferMinutes = await this.settingsService.getDriverBufferMinutes();
    const bufferMs = bufferMinutes * 60 * 1000;

    const windowStart = new Date(new Date(scheduledAt).getTime() - bufferMs);
    const windowEnd = new Date(new Date(scheduledAt).getTime() + bufferMs);

    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.driverId = :driverId', { driverId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.IN_PROGRESS],
      })
      .andWhere('booking.scheduledAt >= :windowStart', { windowStart })
      .andWhere('booking.scheduledAt <= :windowEnd', { windowEnd });

    // Exclude current booking when reassigning
    if (excludeBookingId) {
      qb.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    return qb.getOne();
  }

  // ─── Admin: Get available drivers for a time slot ─────────────────────────────
  async getAvailableDrivers(scheduledAt: string): Promise<Driver[]> {
    const bufferMinutes = await this.settingsService.getDriverBufferMinutes();
    const bufferMs = bufferMinutes * 60 * 1000;
    const date = new Date(scheduledAt);

    const windowStart = new Date(date.getTime() - bufferMs);
    const windowEnd = new Date(date.getTime() + bufferMs);

    // Find all driver IDs that are busy in this window
    const busyBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('booking.driverId')
      .where('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.IN_PROGRESS],
      })
      .andWhere('booking.scheduledAt >= :windowStart', { windowStart })
      .andWhere('booking.scheduledAt <= :windowEnd', { windowEnd })
      .andWhere('booking.driverId IS NOT NULL')
      .getRawMany();

    const busyDriverIds = busyBookings.map((b) => b.booking_driverId);

    // Return active drivers NOT in the busy list
    const qb = this.driverRepo
      .createQueryBuilder('driver')
      .where('driver.status = :status', { status: DriverStatus.ACTIVE });

    if (busyDriverIds.length > 0) {
      qb.andWhere('driver.id NOT IN (:...busyDriverIds)', { busyDriverIds });
    }

    return qb.orderBy('driver.fullName', 'ASC').getMany();
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

  // ─── Client: Edit pending booking (no driver assigned yet) ──────────────────
  async edit(id: string, userId: string, dto: EditBookingDto): Promise<Booking> {
    const booking = await this.findOne(id, userId);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        'فقط رزروهای در انتظار (بدون راننده) قابل ویرایش هستند',
      );
    }

    if (booking.driverId) {
      throw new BadRequestException(
        'رزرو پس از تخصیص راننده قابل ویرایش نیست',
      );
    }

    if (dto.scheduledAt) {
      const minAdvanceMinutes = parseInt(
        (await this.settingsService.get('min_advance_minutes')) || '30',
      );
      const minutesUntilTrip =
        (new Date(dto.scheduledAt).getTime() - Date.now()) / (1000 * 60);
      if (minutesUntilTrip < minAdvanceMinutes) {
        throw new BadRequestException(
          `زمان سفر باید حداقل ${minAdvanceMinutes} دقیقه دیگر باشد`,
        );
      }
      booking.scheduledAt = new Date(dto.scheduledAt);
    }

    if (dto.passengerCount !== undefined) booking.passengerCount = dto.passengerCount;
    if (dto.notes !== undefined) booking.notes = dto.notes;

    return this.bookingRepo.save(booking);
  }

}
