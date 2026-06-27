import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/entities/user.entity';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // ─── Driver Auth (public) ─────────────────────────────────────────────────
  @Post('auth/send-otp')
  @HttpCode(200)
  sendOtp(@Body('phone') phone: string) {
    return this.driversService.sendOtp(phone);
  }

  @Post('auth/verify-otp')
  @HttpCode(200)
  verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    return this.driversService.verifyOtp(phone, otp);
  }

  // ─── PUBLIC: Get driver location for a booking (used by tracking page) ────
  @Get('location/booking/:bookingId')
  getDriverLocationForBooking(@Param('bookingId') bookingId: string) {
    return this.driversService.getDriverLocationForBooking(bookingId);
  }

  // ─── Driver: Own routes ───────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() driver: any) {
    return this.driversService.findOne(driver.id);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(@CurrentUser() driver: any) {
    return this.driversService.getMyStats(driver.id);
  }

  @Get('me/trips')
  @UseGuards(JwtAuthGuard)
  getMyTrips(@CurrentUser() driver: any) {
    return this.driversService.getMyTrips(driver.id);
  }

  @Get('me/trips/:bookingId')
  @UseGuards(JwtAuthGuard)
  getMyTrip(@CurrentUser() driver: any, @Param('bookingId') bookingId: string) {
    return this.driversService.getMyTrip(driver.id, bookingId);
  }

  @Patch('me/trips/:bookingId/status')
  @UseGuards(JwtAuthGuard)
  updateTripStatus(
    @CurrentUser() driver: any,
    @Param('bookingId') bookingId: string,
    @Body('status') status: string,
  ) {
    return this.driversService.updateTripStatus(driver.id, bookingId, status);
  }

  // ─── Driver: Send current GPS location ────────────────────────────────────
  @Patch('me/location')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  updateLocation(
    @CurrentUser() driver: any,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.driversService.updateLocation(driver.id, lat, lng);
  }

  // ─── Admin: CRUD ──────────────────────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: any) {
    return this.driversService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@Query('status') status?: string) {
    return this.driversService.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.driversService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.driversService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }
}
