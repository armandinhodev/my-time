import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTopicDto } from './dto/create-topic.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicsService } from './topics.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('courses/:courseId/topics')
  list(@CurrentUser() user: { userId: string }, @Param('courseId') courseId: string) {
    return this.topicsService.listOwned(user.userId, courseId);
  }

  @Post('courses/:courseId/topics')
  create(@CurrentUser() user: { userId: string }, @Param('courseId') courseId: string, @Body() payload: CreateTopicDto) {
    return this.topicsService.create(user.userId, courseId, payload);
  }

  @Patch('courses/:courseId/topics/reorder')
  reorder(@CurrentUser() user: { userId: string }, @Param('courseId') courseId: string, @Body() payload: ReorderTopicsDto) {
    return this.topicsService.reorder(user.userId, courseId, payload);
  }

  @Patch('topics/:id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() payload: UpdateTopicDto) {
    return this.topicsService.update(user.userId, id, payload);
  }

  @Delete('topics/:id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.topicsService.softDelete(user.userId, id);
  }
}
