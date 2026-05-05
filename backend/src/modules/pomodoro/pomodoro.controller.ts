import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompletePomodoroDto } from './dto/complete-pomodoro.dto';
import { StartPomodoroDto } from './dto/start-pomodoro.dto';
import { PomodoroService } from './pomodoro.service';

@Controller('pomodoro')
@UseGuards(JwtAuthGuard)
export class PomodoroController {
  constructor(private readonly pomodoroService: PomodoroService) {}

  @Get('state')
  state(@CurrentUser() user: { userId: string }) {
    return this.pomodoroService.state(user.userId);
  }

  @Post('start')
  start(@CurrentUser() user: { userId: string }, @Body() payload: StartPomodoroDto) {
    return this.pomodoroService.start(user.userId, payload);
  }

  @Post('pause')
  @HttpCode(200)
  pause(@CurrentUser() user: { userId: string }) {
    return this.pomodoroService.pause(user.userId);
  }

  @Post('resume')
  @HttpCode(200)
  resume(@CurrentUser() user: { userId: string }) {
    return this.pomodoroService.resume(user.userId);
  }

  @Post('complete')
  complete(@CurrentUser() user: { userId: string }, @Body() payload: CompletePomodoroDto) {
    return this.pomodoroService.complete(user.userId, payload);
  }

  @Post('cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: { userId: string }) {
    return this.pomodoroService.cancel(user.userId);
  }
}
