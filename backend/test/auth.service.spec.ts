import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { UsersService } from '../src/modules/users/users.service';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthService smoke', () => {
  it('registers a user and returns tokens', async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'ada@example.com', name: 'Ada' }),
      updateRefreshState: jest.fn().mockResolvedValue(undefined)
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token')
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => (key === 'JWT_ACCESS_SECRET' ? 'access-secret' : 'refresh-secret')),
      get: jest.fn((_: string, fallback: string) => fallback)
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService }
      ]
    }).compile();

    const authService = moduleRef.get(AuthService);
    const session = await authService.register({
      email: 'ada@example.com',
      password: 'Password123',
      name: 'Ada'
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        name: 'Ada',
        passwordHash: expect.any(String)
      })
    );
    expect(usersService.updateRefreshState).toHaveBeenCalledWith('user-1', expect.any(String), expect.any(String));
    expect(session).toEqual({
      user: { id: 'user-1', email: 'ada@example.com', name: 'Ada' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    });
  });
});
