import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException, Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/entities/user.entity';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ── Customer uploads their own avatar ─────────────────────────────────────
  @Post('avatar/me')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('فایلی انتخاب نشده');
    return this.uploadService.updateUserAvatar(user.id, file.filename);
  }

  // ── Admin uploads driver avatar ────────────────────────────────────────────
  @Post('avatar/driver/:driverId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDriverAvatarAdmin(
    @Param('driverId') driverId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('فایلی انتخاب نشده');
    return this.uploadService.updateDriverAvatar(driverId, file.filename);
  }
  // ── Admin deletes driver avatar ────────────────────────────────────────────
  @Delete('avatar/driver/:driverId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteDriverAvatarAdmin(
    @Param('driverId') driverId: string
  ) {

    return this.uploadService.deleteDriverAvatar(driverId);
  }

  // ── Driver uploads their own avatar ───────────────────────────────────────
  @Post('avatar/driver/me')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyDriverAvatar(
    @CurrentUser() driver: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('فایلی انتخاب نشده');
    return this.uploadService.updateDriverAvatar(driver.id, file.filename);
  }
}
