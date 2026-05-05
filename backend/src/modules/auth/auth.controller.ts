import { Body, Controller, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() payload: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.register(payload);
    this.setRefreshCookie(response, session.refreshToken);
    return { user: session.user, accessToken: session.accessToken };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() payload: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.login(payload);
    this.setRefreshCookie(response, session.refreshToken);
    return { user: session.user, accessToken: session.accessToken };
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@CurrentUser() user: { userId: string; refreshToken: string; family: string }, @Res({ passthrough: true }) response: Response) {
    if (!user?.refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const session = await this.authService.refresh(user.userId, user.refreshToken, user.family);
    this.setRefreshCookie(response, session.refreshToken);
    return { user: session.user, accessToken: session.accessToken };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: { userId: string }, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(user.userId);
    response.clearCookie(this.configService.get<string>('COOKIE_NAME', 'mytime_refresh'));
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie(this.configService.get<string>('COOKIE_NAME', 'mytime_refresh'), token, {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE', 'false') === 'true',
      sameSite: 'lax',
      domain: this.configService.get<string>('COOKIE_DOMAIN', 'localhost'),
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }
}
