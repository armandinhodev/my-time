import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { QueryStudySessionsDto } from './dto/query-study-sessions.dto';
import { StudySessionsService } from './study-sessions.service';

@Controller('study-sessions')
@UseGuards(JwtAuthGuard)
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }, @Query() query: QueryStudySessionsDto) {
    return this.studySessionsService.list(user.userId, query);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() payload: CreateStudySessionDto) {
    return this.studySessionsService.create(user.userId, payload);
  }

  @Get('stats')
  stats(@CurrentUser() user: { userId: string }) {
    return this.studySessionsService.stats(user.userId);
  }
}
