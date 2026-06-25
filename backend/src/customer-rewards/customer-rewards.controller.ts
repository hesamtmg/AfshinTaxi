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
import { CustomerRewardsService } from './customer-rewards.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomerRewardStatus } from './entities/customer-reward.entity';
import { RewardRule } from './entities/reward-rule.entity';
import { UserRole } from '../database/entities/user.entity';

@Controller('customer-rewards')
@UseGuards(JwtAuthGuard)
export class CustomerRewardsController {
  constructor(private readonly svc: CustomerRewardsService) {}

  // ── Customer endpoints ─────────────────────────────────────────

  // GET /customer-rewards/my  — wallet + active coupons + pending count
  @Get('my')
  getMyRewards(@Request() req) {
    return this.svc.getCustomerRewards(req.user.id);
  }

  // POST /customer-rewards/use-coupon  — apply coupon at checkout
  @Post('use-coupon')
  useCoupon(
    @Body('couponCode') couponCode: string,
    @Body('bookingFare') bookingFare: number,
    @Request() req,
  ) {
    return this.svc.useCoupon(couponCode, req.user.id, bookingFare);
  }

  // ── Admin: Rules ───────────────────────────────────────────────

  // GET /customer-rewards/admin/rules
  @Get('admin/rules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getRules() {
    return this.svc.getAllRules();
  }

  // POST /customer-rewards/admin/rules
  @Post('admin/rules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createRule(@Body() body: Partial<RewardRule>) {
    return this.svc.createRule(body);
  }

  // PATCH /customer-rewards/admin/rules/:id
  @Patch('admin/rules/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRule(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<RewardRule>) {
    return this.svc.updateRule(id, body);
  }

  // DELETE /customer-rewards/admin/rules/:id
  @Delete('admin/rules/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteRule(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteRule(id);
  }

  // ── Admin: Customer reward approvals ──────────────────────────

  // GET /customer-rewards/admin/pending
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getPending() {
    return this.svc.getPendingRewards();
  }

  // GET /customer-rewards/admin/all?status=approved
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAll(@Query('status') status?: CustomerRewardStatus) {
    return this.svc.getAllRewards(status);
  }

  // PATCH /customer-rewards/admin/:id/approve
  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
    @Request() req,
  ) {
    return this.svc.approveReward(id, req.user.id, note);
  }

  // PATCH /customer-rewards/admin/:id/reject
  @Patch('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
    @Request() req,
  ) {
    return this.svc.rejectReward(id, req.user.id, note);
  }
}
