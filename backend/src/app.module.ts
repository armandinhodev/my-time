import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { TopicsModule } from './modules/topics/topics.module';
import { StudySessionsModule } from './modules/study-sessions/study-sessions.module';
import { PomodoroModule } from './modules/pomodoro/pomodoro.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({ uri: configService.getOrThrow<string>('MONGO_URI') })
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    TopicsModule,
    StudySessionsModule,
    PomodoroModule
  ]
})
export class AppModule {}
