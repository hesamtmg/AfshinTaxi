import { IsDateString, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class EditBookingDto {
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsNumber()
  @Min(1)
  @Max(8)
  @IsOptional()
  passengerCount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
