import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Primero intentar leer de la cookie
          const cookieToken = request?.cookies?.[configService.get<string>('COOKIE_NAME', 'mytime_refresh')];
          if (cookieToken) return cookieToken;
          
          // Fallback: leer del body (para localStorage en cross-domain)
          return request?.body?.refreshToken;
        }
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true
    });
  }

  validate(request: Request, payload: { sub: string; email: string; family: string }) {
    // Intentar obtener el refresh token de la cookie o del body
    const refreshToken = request.cookies?.[process.env.COOKIE_NAME || 'mytime_refresh'] || request.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return { userId: payload.sub, email: payload.email, family: payload.family, refreshToken };
  }
}
