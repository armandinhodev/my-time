import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { TopicsModule } from './modules/topics/topics.module';
import { StudySessionsModule } from './modules/study-sessions/study-sessions.module';
import { PomodoroModule } from './modules/pomodoro/pomodoro.module';

const mongoLogger = new Logger('MongoBootstrap');

function describeMongoTarget(uri: string) {
  try {
    const normalized = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://') ? uri : `mongodb://${uri}`;
    const parsed = new URL(normalized);
    const database = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : '(default)';
    return `${parsed.hostname}:${parsed.port || '(default)'}/${database}`;
  } catch {
    return '(unparsed target)';
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.getOrThrow<string>('MONGO_URI');
        const target = describeMongoTarget(uri);

        mongoLogger.log(`Attempting MongoDB connection to ${target}`);

        return {
          uri,
          connectionFactory: (connection: { on: (event: string, handler: (...args: unknown[]) => void) => void }) => {
            connection.on('connected', () => {
              mongoLogger.log(`MongoDB connection established to ${target}`);
            });

            connection.on('error', (error: unknown) => {
              const message = error instanceof Error ? error.message : String(error);
              mongoLogger.error(`MongoDB connection error on ${target}: ${message}`);
            });

            return connection;
          }
        };
      }
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
