import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardRule } from './entities/reward-rule.entity';
import { CustomerReward } from './entities/customer-reward.entity';
import { CustomerPoints } from './entities/customer-points.entity';
import { CustomerRewardsService } from './customer-rewards.service';
import { CustomerRewardsController } from './customer-rewards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RewardRule, CustomerReward, CustomerPoints])],
  providers: [CustomerRewardsService],
  controllers: [CustomerRewardsController],
  exports: [CustomerRewardsService], // so BookingsService can call checkAndCreateRewards
})
export class CustomerRewardsModule {}
