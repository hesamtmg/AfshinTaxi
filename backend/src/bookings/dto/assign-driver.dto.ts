import { IsUUID, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class AssignDriverDto {
  @IsUUID()
  @IsNotEmpty()
  driverId: string;

  @IsNumber()
  @IsOptional()
  finalFare?: number;
}
