import { ConflictException, Injectable } from '@nestjs/common';

import { CoursesService } from '../courses/courses.service';
import { TopicsService } from '../topics/topics.service';
import { CreateStudySessionDto } from '../study-sessions/dto/create-study-session.dto';
import { StudySessionsService } from '../study-sessions/study-sessions.service';
import { UsersService } from '../users/users.service';
import { CompletePomodoroDto } from './dto/complete-pomodoro.dto';
import { StartPomodoroDto } from './dto/start-pomodoro.dto';

@Injectable()
export class PomodoroService {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly topicsService: TopicsService,
    private readonly studySessionsService: StudySessionsService,
    private readonly usersService: UsersService
  ) {}

  async start(userId: string, payload: StartPomodoroDto) {
    await this.coursesService.assertOwned(userId, payload.courseId);
    if (payload.topicId) {
      await this.topicsService.assertOwned(userId, payload.topicId);
    }
    const user = await this.usersService.findById(userId);
    if (user?.activePomodoro?.endsAt && new Date(user.activePomodoro.endsAt).getTime() > Date.now()) {
      throw new ConflictException('Pomodoro already active');
    }
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + payload.durationSec * 1000);
    await this.usersService.startPomodoro(userId, {
      courseId: payload.courseId,
      topicId: payload.topicId,
      mode: payload.mode,
      startedAt,
      endsAt,
      durationSec: payload.durationSec
    });
    return {
      state: payload.mode === 'focus' ? 'running' : 'break',
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString()
    };
  }

  async complete(userId: string, payload: CompletePomodoroDto) {
    const user = await this.usersService.findById(userId);
    const activePomodoro = user?.activePomodoro;
    if (!activePomodoro) {
      throw new ConflictException('No active pomodoro');
    }

    const startedAt = new Date(payload.startedAt);
    const endedAt = new Date(payload.endedAt);
    if (endedAt <= startedAt) {
      throw new ConflictException('Invalid pomodoro range');
    }
    if (Date.now() - startedAt.getTime() > 60 * 60 * 1000) {
      await this.usersService.clearActivePomodoro(userId);
      throw new ConflictException('Pomodoro expired');
    }
    if (
      activePomodoro.courseId !== payload.courseId ||
      (activePomodoro.topicId ?? null) !== (payload.topicId ?? null) ||
      activePomodoro.mode !== payload.mode ||
      new Date(activePomodoro.startedAt).toISOString() !== startedAt.toISOString()
    ) {
      throw new ConflictException('Pomodoro state mismatch');
    }
    const studySession = await this.studySessionsService.create(userId, payload as CreateStudySessionDto);
    await this.usersService.completePomodoro(userId);
    return { studySession, state: 'completed' };
  }

  async cancel(userId: string) {
    await this.usersService.clearActivePomodoro(userId);
    return { state: 'idle' };
  }
}
