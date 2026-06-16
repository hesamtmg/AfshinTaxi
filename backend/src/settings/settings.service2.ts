import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../database/entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async set(key: string, value: string, description?: string): Promise<Setting> {
    let setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingRepo.create({ key, description });
    }
    setting.value = value;
    return this.settingRepo.save(setting);
  }

  async getAll(): Promise<Setting[]> {
    return this.settingRepo.find();
  }

  async getFarePerKm(): Promise<number> {
    const val = await this.get('fare_per_km');
    return parseFloat(val || '1.5');
  }
}
