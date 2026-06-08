import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Invalid phone number' })
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
