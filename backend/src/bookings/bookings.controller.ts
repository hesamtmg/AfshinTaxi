import {
  Controller, Get, Post, Patch, Body, Param,
  UseGuards, Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User } from '../database/entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { BookingStatus } from './entities/booking.entity';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ─── Client routes ───────────────────────────────────────────────────────────
  @Post()
  @Roles(UserRole.CLIENT)
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('my')
  @Roles(UserRole.CLIENT)
  getMyBookings(@CurrentUser() user: User) {
    return this.bookingsService.findMyBookings(user.id);
  }

  @Get('my/:id')
  @Roles(UserRole.CLIENT)
  getMyBooking(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user.id);
  }

  @Patch('my/:id/cancel')
  @Roles(UserRole.CLIENT)
  cancelBooking(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, user.id, reason);
  }

  // ─── Admin routes ────────────────────────────────────────────────────────────
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('status') status?: BookingStatus) {
    return this.bookingsService.findAll({ status });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.bookingsService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/assign-driver')
  @Roles(UserRole.ADMIN)
  assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.bookingsService.assignDriver(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus) {
    return this.bookingsService.updateStatus(id, status);
  }
}
