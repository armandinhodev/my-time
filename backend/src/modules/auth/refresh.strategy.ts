import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => request?.cookies?.[configService.get<string>('COOKIE_NAME', 'mytime_refresh')]]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true
    });
  }

  validate(request: Request, payload: { sub: string; email: string; family: string }) {
    const refreshToken = request.cookies?.[process.env.COOKIE_NAME || 'mytime_refresh'];
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return { userId: payload.sub, email: payload.email, family: payload.family, refreshToken };
  }
}
