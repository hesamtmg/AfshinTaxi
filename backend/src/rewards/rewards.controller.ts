import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RewardStatus } from './entities/driver-reward.entity';
import { UserRole } from '../database/entities/user.entity';
@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // ─── Driver endpoints ───────────────────────────────────────────

  // GET /rewards/my-badges  — driver's own approved badges
  @Get('my-badges')
  getMyBadges(@Request() req) {
    return this.rewardsService.getDriverBadges(req.user.driverId || req.user.id);
  }

  // ─── Admin endpoints ────────────────────────────────────────────

  // GET /rewards/admin/pending
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getPending() {
    return this.rewardsService.getPendingRewards();
  }

  // GET /rewards/admin/all?status=approved
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAll(@Query('status') status?: RewardStatus) {
    return this.rewardsService.getAllRewards(status);
  }

  // GET /rewards/admin/driver/:driverId
  @Get('admin/driver/:driverId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getDriverRewards(@Param('driverId', ParseIntPipe) driverId: number) {
    return this.rewardsService.getDriverRewardsAdmin(driverId);
  }

  // POST /rewards/admin/custom  — create custom reward
  @Post('admin/custom')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createCustom(
    @Body() body: { driverId: number; title: string; description?: string; icon?: string },
  ) {
    return this.rewardsService.createCustomReward(body);
  }

  // PATCH /rewards/admin/:id/approve
  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
    @Request() req,
  ) {
    return this.rewardsService.approveReward(id, req.user.id, note);
  }

  // PATCH /rewards/admin/:id/reject
  @Patch('admin/:id/reject')
  @UseGuards(RolesGuard)
   @Roles(UserRole.ADMIN)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
    @Request() req,
  ) {
    return this.rewardsService.rejectReward(id, req.user.id, note);
  }

  // POST /rewards/admin/run-monthly-check
  @Post('admin/run-monthly-check')
  @UseGuards(RolesGuard)
   @Roles(UserRole.ADMIN)
  runMonthlyCheck() {
    return this.rewardsService.checkMonthlyTopDriver();
  }
}
