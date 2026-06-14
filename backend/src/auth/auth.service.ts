import {
  Injectable, BadRequestException,
  UnauthorizedException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../database/entities/user.entity';
import { SmsService } from '../sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  // ─── Client Registration (Step 1) ───────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (existing && existing.isVerified) {
      throw new BadRequestException('Phone number already registered');
    }

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    let user = existing;
    if (!user) {
      user = this.userRepo.create({
        phone: dto.phone,
        fullName: dto.fullName,
        email: dto.email,
        role: UserRole.CLIENT,
      });
    }

    user.otpCode = await bcrypt.hash(otp, 8);
    user.otpExpiresAt = otpExpiresAt;
    await this.userRepo.save(user);

    await this.smsService.sendOtp(dto.phone, otp);

    return { message: 'OTP sent to your phone number' };
  }

  // ─── Verify OTP & Complete Registration (Step 2) ────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userRepo.findOne({
      where: { phone: dto.phone },
      select: ['id', 'phone', 'fullName', 'role', 'isVerified', 'otpCode', 'otpExpiresAt'],
    });

    if (!user) throw new NotFoundException('User not found');

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired');
    }

  
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.userRepo.save(user);

    const token = this.signToken(user);
    return { token, user: this.sanitize(user) };
  }

  // ─── Login (Step 1: send OTP) ────────────────────────────────────────────────
  async login(dto: LoginDto) {

    const user = await this.userRepo.findOne({ where: { phone: dto.phone } });
        console.log(dto.phone,user)
    if (!user || !user.isVerified) {
      throw new UnauthorizedException('Phone number not registered');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otpCode = await bcrypt.hash(otp, 8);
    user.otpExpiresAt = otpExpiresAt;
    await this.userRepo.save(user);

    await this.smsService.sendOtp(dto.phone, otp);

    return { message: 'OTP sent to your phone number' };
  }

  // ─── Admin Login (email + password) ─────────────────────────────────────────
  async adminLogin(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email, role: UserRole.ADMIN },
      select: ['id', 'email', 'fullName', 'role', 'password', 'isActive'],
    });
    
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account suspended');

    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user);
    return { token, user: this.sanitize(user) };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private signToken(user: Partial<User>): string {
    return this.jwtService.sign({ sub: user.id, role: user.role });
  }

  private sanitize(user: User) {
    const { otpCode, otpExpiresAt, password, ...safe } = user as any;
    return safe;
  }
}
