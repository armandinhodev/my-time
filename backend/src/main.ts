import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ 
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:4200', 'http://localhost:5173', 'http://localhost', 'http://localhost:80'], 
    credentials: true 
  });
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}

void bootstrap();
