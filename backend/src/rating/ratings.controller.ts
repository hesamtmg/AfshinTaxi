import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly svc: RatingsService) {}

  // ── Customer ───────────────────────────────────────────────────

  // POST /ratings  — submit a rating
  @Post()
  submit(
    @Body() body: { bookingId: string; stars: number; comment?: string },
    @Request() req,
  ) {
    return this.svc.submitRating({
      bookingId: body.bookingId,
      userId: req.user.id,
      stars: body.stars,
      comment: body.comment,
    });
  }

  // GET /ratings/status/:bookingId  — can this customer rate this booking?
  @Get('status/:bookingId')
  getRatingStatus(
    @Param('bookingId') bookingId: string,
    @Request() req,
  ) {

    return this.svc.getRatingStatus(bookingId, req.user.id);
  }

  // GET /ratings/my  — customer's submitted ratings history
  @Get('my')
  getMyRatings(@Request() req) {
    return this.svc.getCustomerRatings(req.user.id);
  }

  // ── Driver ─────────────────────────────────────────────────────

  // GET /ratings/driver/me  — driver's own ratings + stats
  @Get('driver/me')
  getMyDriverRatings(@Request() req) {
    return this.svc.getDriverRatings(req.user.driverId || req.user.id);
  }

  // ── Admin ──────────────────────────────────────────────────────

  // GET /ratings/admin/stats
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.svc.getAdminStats();
  }

  // GET /ratings/admin/all?driverId=1&minStars=1&maxStars=5&isVisible=true
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAll(
    @Query('driverId') driverId?: string,
    @Query('minStars') minStars?: string,
    @Query('maxStars') maxStars?: string,
    @Query('isVisible') isVisible?: string,
  ) {
    return this.svc.getAllRatings({
      driverId: driverId ? Number(driverId) : undefined,
      minStars: minStars ? Number(minStars) : undefined,
      maxStars: maxStars ? Number(maxStars) : undefined,
      isVisible: isVisible !== undefined ? isVisible === 'true' : undefined,
    });
  }

  // GET /ratings/admin/driver/:driverId
  @Get('admin/driver/:driverId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getDriverRatings(@Param('driverId', ParseIntPipe) driverId: string) {
    return this.svc.getDriverRatings(driverId);
  }

  // PATCH /ratings/admin/:id/hide
  @Patch('admin/:id/hide')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  hide(
    @Param('id') id: string,
    @Body('note') note: string,
    @Request() req,
  ) {
    return this.svc.hideRating(id, req.user.id, note);
  }

  // PATCH /ratings/admin/:id/restore
  @Patch('admin/:id/restore')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  restore(@Param('id') id: string) {
    return this.svc.restoreRating(id);
  }

  // DELETE /ratings/admin/:id
  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.svc.deleteRating(id);
  }
}
