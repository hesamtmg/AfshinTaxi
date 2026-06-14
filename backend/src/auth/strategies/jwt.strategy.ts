import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';
import { Driver } from '../../database/entities/driver.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    // Driver token
    if (payload.role === 'driver') {
      const driver = await this.driverRepo.findOne({ where: { id: payload.sub } });
      if (!driver || (driver as any).status === 'suspended') throw new UnauthorizedException();
      return { ...driver, role: 'driver' };
    }

    // User token (client / admin)
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return user;
  }
}
