import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min, Max } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @IsNumber()
  pickupLat: number;

  @IsNumber()
  pickupLng: number;

  @IsString()
  @IsNotEmpty()
  dropoffAddress: string;

  @IsNumber()
  dropoffLat: number;

  @IsNumber()
  dropoffLng: number;

  @IsNumber()
  distanceKm: number;

  @IsDateString()
  scheduledAt: string;

  @IsNumber()
  @Min(1)
  @Max(8)
  @IsOptional()
  passengerCount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
