import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(payload: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(payload.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.usersService.create({ email: payload.email, passwordHash, name: payload.name });
    return this.issueSession(user.id, user.email, user.name ?? undefined);
  }

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueSession(user.id, user.email, user.name ?? undefined);
  }

  async refresh(userId: string, refreshToken: string, family: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash || !user.refreshFamily) {
      throw new UnauthorizedException('Session expired');
    }
    if (user.refreshFamily !== family || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
      await this.usersService.updateRefreshState(userId, null, null);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    return this.issueSession(user.id, user.email, user.name ?? undefined, user.refreshFamily);
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshState(userId, null, null);
  }

  async issueSession(userId: string, email: string, name?: string, family?: string) {
    const refreshFamily = family ?? randomUUID();
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, name },
      { secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m') }
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, family: refreshFamily },
      { secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d') }
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshState(userId, refreshTokenHash, refreshFamily);
    return {
      user: { id: userId, email, name: name ?? null },
      accessToken,
      refreshToken
    };
  }
}
