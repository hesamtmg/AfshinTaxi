import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@Controller('settings')

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  set(@Body() body: { key: string; value: string; description?: string }) {
    return this.settingsService.set(body.key, body.value, body.description);
  }
}
