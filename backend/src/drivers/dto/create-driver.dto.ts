import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateDriverDto {
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsNotEmpty() carModel: string;
  @IsString() @IsNotEmpty() carPlate: string;
  @IsString() @IsOptional() carColor?: string;
  @IsString() @IsOptional() carYear?: string;
  @IsString() @IsOptional() licenseNumber?: string;
}
