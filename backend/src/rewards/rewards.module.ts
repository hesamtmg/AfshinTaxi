import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverReward } from './entities/driver-reward.entity';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DriverReward])],
  providers: [RewardsService],
  controllers: [RewardsController],
  exports: [RewardsService], // exported so BookingsService can call checkAndCreateRewards
})
export class RewardsModule {}
