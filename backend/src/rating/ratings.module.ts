import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRating } from './entities/trip-rating.entity';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { Booking } from 'src/bookings/entities/booking.entity';


@Module({
  imports: [TypeOrmModule.forFeature([TripRating,Booking])],
  providers: [RatingsService],
  controllers: [RatingsController],
  exports: [RatingsService],
})
export class RatingsModule {}
