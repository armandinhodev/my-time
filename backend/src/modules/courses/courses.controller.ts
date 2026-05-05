import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TopicsService } from '../topics/topics.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesService } from './courses.service';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService, private readonly topicsService: TopicsService) {}

  @Get()
  async list(@CurrentUser() user: { userId: string }) {
    const items = await this.coursesService.list(user.userId);
    return { items, total: items.length };
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() payload: CreateCourseDto) {
    return this.coursesService.create(user.userId, payload);
  }

  @Get(':id')
  async detail(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    const [course, topics] = await Promise.all([
      this.coursesService.findOne(user.userId, id),
      this.topicsService.listOwned(user.userId, id)
    ]);
    return { ...course, topics };
  }

  @Patch(':id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() payload: UpdateCourseDto) {
    return this.coursesService.update(user.userId, id, payload);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.coursesService.remove(user.userId, id);
  }
}
