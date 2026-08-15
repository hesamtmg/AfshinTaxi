import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TripRating } from './entities/trip-rating.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(TripRating)
    private ratingRepo: Repository<TripRating>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    private dataSource: DataSource,

  ) { }

  // ── Customer: submit rating ────────────────────────────────────

  async submitRating(dto: {
    bookingId: string;
    userId: string;
    stars: number;
    comment?: string;
  }): Promise<TripRating> {
    if (dto.stars < 1 || dto.stars > 5) {
      throw new BadRequestException('امتیاز باید بین ۱ تا ۵ باشد');
    }

    // Check booking belongs to customer and is completed
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } })

    if (!booking) throw new NotFoundException('سفر یافت نشد');

    const b = booking;

    if (b.userId !== dto.userId) {
      throw new ForbiddenException('این سفر متعلق به شما نیست');
    }

    if (b.status !== 'completed') {
      throw new BadRequestException('فقط سفرهای تکمیل‌شده قابل امتیازدهی هستند');
    }

    // Check not already rated
    const existing = await this.ratingRepo.findOne({
      where: { bookingId: dto.bookingId },
    });
    if (existing) {
      throw new BadRequestException('قبلاً به این سفر امتیاز داده‌اید');
    }

    const rating = await this.ratingRepo.save(
      this.ratingRepo.create({
        bookingId: dto.bookingId,
        userId: dto.userId,
        driverId: b.driverId,
        stars: dto.stars,
        comment: dto.comment,
      }),
    );

    // Update booking rating column if it exists
    await this.dataSource.query(
      `UPDATE bookings SET rating = $1 WHERE id = $2`,
      [dto.stars, dto.bookingId],
    );

    // Recalculate driver average rating
    await this.recalculateDriverRating(b.driverId);

    return rating;
  }

  // Customer: check if they can rate a specific booking
  async getRatingStatus(bookingId: string, customerId: string): Promise<{
    canRate: boolean;
    existingRating: TripRating | null;
    reason?: string;
  }> {
    // const booking = await this.dataSource.query(
    //   `SELECT id,userId, status FROM bookings WHERE id = $1`,
    //   [bookingId],
    // );
    // console.log('bokkin',bookingId)
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } })
    if (!booking) return { canRate: false, existingRating: null, reason: 'سفر یافت نشد' };

    const b = booking;

    if (b.userId !== customerId) {
      return { canRate: false, existingRating: null, reason: 'دسترسی غیرمجاز' };
    }

    if (b.status !== 'completed') {
      return { canRate: false, existingRating: null, reason: 'سفر هنوز تکمیل نشده' };
    }
    console.log('bokkin2', booking)
    const existing = await this.ratingRepo.findOne({ where: { bookingId: bookingId } });
    if (existing) {
      return { canRate: false, existingRating: existing, reason: 'قبلاً امتیاز داده‌اید' };
    }

    return { canRate: true, existingRating: null };
  }

  // Customer: get all ratings they've submitted
  async getCustomerRatings(customerId: string): Promise<TripRating[]> {
    return this.ratingRepo.find({
      where: { userId: customerId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Driver: get own ratings ────────────────────────────────────

  async getDriverRatings(driverId: string): Promise<{
    ratings: TripRating[];
    average: number;
    totalCount: number;
    distribution: Record<number, number>;
  }> {
    const ratings = await this.ratingRepo.find({
      where: { driverId, isVisible: true },
      order: { createdAt: 'DESC' },
    });

    const totalCount = ratings.length;
    const average = totalCount
      ? Math.round((ratings.reduce((s, r) => s + r.stars, 0) / totalCount) * 10) / 10
      : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => { distribution[r.stars] = (distribution[r.stars] || 0) + 1; });

    return { ratings, average, totalCount, distribution };
  }

  // ── Admin ──────────────────────────────────────────────────────

  async getAllRatings(filters?: {
    driverId?: number;
    minStars?: number;
    maxStars?: number;
    isVisible?: boolean;
  }): Promise<TripRating[]> {
    const qb = this.ratingRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.driver', 'driver')
      .leftJoinAndSelect('r.booking', 'booking')
      .orderBy('r.createdAt', 'DESC');

    if (filters?.driverId) qb.andWhere('r.driverId = :driverId', { driverId: filters.driverId });
    if (filters?.minStars) qb.andWhere('r.stars >= :min', { min: filters.minStars });
    if (filters?.maxStars) qb.andWhere('r.stars <= :max', { max: filters.maxStars });
    if (filters?.isVisible !== undefined) qb.andWhere('r.isVisible = :v', { v: filters.isVisible });

    return qb.getMany();
  }

  async getAdminStats(): Promise<{
    totalRatings: number;
    averageOverall: number;
    distribution: Record<number, number>;
    hiddenCount: number;
    recentCount: number; // last 30 days
  }> {
    const all = await this.ratingRepo.find();
    const visible = all.filter((r) => r.isVisible);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    visible.forEach((r) => { distribution[r.stars] = (distribution[r.stars] || 0) + 1; });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      totalRatings: all.length,
      averageOverall:
        visible.length
          ? Math.round((visible.reduce((s, r) => s + r.stars, 0) / visible.length) * 10) / 10
          : 0,
      distribution,
      hiddenCount: all.filter((r) => !r.isVisible).length,
      recentCount: all.filter((r) => r.createdAt >= thirtyDaysAgo).length,
    };
  }

  // Admin: hide a rating
  async hideRating(id: string, adminId: string, note?: string): Promise<TripRating> {
    const rating = await this.ratingRepo.findOne({ where: { id } });
    if (!rating) throw new NotFoundException('امتیاز یافت نشد');

    rating.isVisible = false;
    rating.hiddenBy = adminId;
    rating.hiddenAt = new Date();
    if (note) rating.adminNote = note;

    const saved = await this.ratingRepo.save(rating);
    await this.recalculateDriverRating(rating.driverId);
    return saved;
  }

  // Admin: restore a hidden rating
  async restoreRating(id: string): Promise<TripRating> {
    const rating = await this.ratingRepo.findOne({ where: { id } });
    if (!rating) throw new NotFoundException('امتیاز یافت نشد');

    rating.isVisible = true;
    rating.hiddenBy = null;
    rating.hiddenAt = null;
    rating.adminNote = null;

    const saved = await this.ratingRepo.save(rating);
    await this.recalculateDriverRating(rating.driverId);
    return saved;
  }

  // Admin: delete permanently
  async deleteRating(id: string): Promise<void> {
    const rating = await this.ratingRepo.findOne({ where: { id } });
    if (!rating) throw new NotFoundException('امتیاز یافت نشد');
    await this.ratingRepo.delete(id);
    console.log('rateeeee',rating)
    await this.recalculateDriverRating(rating.driverId);
  }

  // ── Internal ───────────────────────────────────────────────────

  private async recalculateDriverRating(driverId: string): Promise<void> {
    const result = await this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.stars)', 'avg')
      .where('r.driver_id = :driverId AND r.isVisible = true', { driverId })
      .getRawOne();

    const avg = result?.avg ? parseFloat(parseFloat(result.avg).toFixed(2)) : null;

    await this.dataSource.query(
      `UPDATE drivers SET rating = $1 WHERE id = $2`,
      [avg, driverId],
    );
  }
}
