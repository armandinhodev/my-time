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

  private snapshotActivePomodoro(activePomodoro: {
    courseId: string;
    topicId?: string | null;
    mode: 'focus' | 'shortBreak' | 'longBreak';
    status: 'running' | 'paused';
    startedAt: Date;
    endsAt: Date;
    durationSec: number;
    remainingSec: number;
    pausedAt?: Date | null;
  }) {
    return {
      courseId: activePomodoro.courseId,
      topicId: activePomodoro.topicId ?? null,
      mode: activePomodoro.mode,
      status: activePomodoro.status,
      startedAt: new Date(activePomodoro.startedAt),
      endsAt: new Date(activePomodoro.endsAt),
      durationSec: activePomodoro.durationSec,
      remainingSec: activePomodoro.remainingSec,
      pausedAt: activePomodoro.pausedAt ? new Date(activePomodoro.pausedAt) : null,
    };
  }

  async start(userId: string, payload: StartPomodoroDto) {
    await this.coursesService.assertOwned(userId, payload.courseId);
    if (payload.topicId) {
      await this.topicsService.assertOwned(userId, payload.topicId);
    }
    const user = await this.usersService.findById(userId);
    if (user?.activePomodoro && (user.activePomodoro.status === 'paused' || new Date(user.activePomodoro.endsAt).getTime() > Date.now())) {
      throw new ConflictException('Pomodoro already active');
    }
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + payload.durationSec * 1000);
    await this.usersService.startPomodoro(userId, {
      courseId: payload.courseId,
      topicId: payload.topicId,
      mode: payload.mode,
      status: 'running',
      startedAt,
      endsAt,
      durationSec: payload.durationSec,
      remainingSec: payload.durationSec,
      pausedAt: null,
    });
    return {
      state: payload.mode === 'focus' ? 'running' : 'break',
      active: true,
      mode: payload.mode,
      durationSec: payload.durationSec,
      remainingSec: payload.durationSec,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString()
    };
  }

  async state(userId: string) {
    const user = await this.usersService.findById(userId);
    const activePomodoro = user?.activePomodoro;

    if (!activePomodoro) {
      return { active: false };
    }

    if (activePomodoro.status === 'running' && new Date(activePomodoro.endsAt).getTime() <= Date.now()) {
      return {
        active: true,
        expired: true,
        status: activePomodoro.status,
        mode: activePomodoro.mode,
        courseId: activePomodoro.courseId,
        topicId: activePomodoro.topicId ?? null,
        startedAt: new Date(activePomodoro.startedAt).toISOString(),
        endsAt: new Date(activePomodoro.endsAt).toISOString(),
        durationSec: activePomodoro.durationSec,
        remainingSec: 0,
      };
    }

    return {
      active: true,
      expired: false,
      status: activePomodoro.status,
      mode: activePomodoro.mode,
      courseId: activePomodoro.courseId,
      topicId: activePomodoro.topicId ?? null,
      startedAt: new Date(activePomodoro.startedAt).toISOString(),
      endsAt: new Date(activePomodoro.endsAt).toISOString(),
      durationSec: activePomodoro.durationSec,
      remainingSec:
        activePomodoro.status === 'paused'
          ? activePomodoro.remainingSec
          : Math.max(0, Math.floor((new Date(activePomodoro.endsAt).getTime() - Date.now()) / 1000)),
    };
  }

  async pause(userId: string) {
    const user = await this.usersService.findById(userId);
    const activePomodoro = user?.activePomodoro;
    if (!activePomodoro) {
      throw new ConflictException('No active pomodoro');
    }
    if (activePomodoro.status === 'paused') {
      throw new ConflictException('Pomodoro already paused');
    }

    const remainingSec = Math.max(0, Math.floor((new Date(activePomodoro.endsAt).getTime() - Date.now()) / 1000));
    await this.usersService.updateActivePomodoro(userId, {
      ...this.snapshotActivePomodoro(activePomodoro),
      status: 'paused',
      remainingSec,
      pausedAt: new Date(),
    });

    return { active: true, status: 'paused', remainingSec };
  }

  async resume(userId: string) {
    const user = await this.usersService.findById(userId);
    const activePomodoro = user?.activePomodoro;
    if (!activePomodoro) {
      throw new ConflictException('No active pomodoro');
    }
    if (activePomodoro.status !== 'paused') {
      throw new ConflictException('Pomodoro is not paused');
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + activePomodoro.remainingSec * 1000);
    await this.usersService.updateActivePomodoro(userId, {
      ...this.snapshotActivePomodoro(activePomodoro),
      status: 'running',
      endsAt,
      pausedAt: null,
    });

    return {
      active: true,
      status: 'running',
      startedAt: new Date(activePomodoro.startedAt).toISOString(),
      endsAt: endsAt.toISOString(),
      durationSec: activePomodoro.durationSec,
      remainingSec: activePomodoro.remainingSec,
      mode: activePomodoro.mode,
      courseId: activePomodoro.courseId,
      topicId: activePomodoro.topicId ?? null,
    };
  }

  async complete(userId: string, payload: CompletePomodoroDto) {
    const user = await this.usersService.findById(userId);
    const activePomodoro = user?.activePomodoro;
    if (!activePomodoro) {
      throw new ConflictException('No active pomodoro');
    }
    if (activePomodoro.status === 'paused') {
      throw new ConflictException('Paused pomodoro cannot be completed');
    }

    const startedAt = new Date(payload.startedAt);
    const endedAt = new Date(payload.endedAt);
    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
      throw new ConflictException('Invalid pomodoro timestamps');
    }
    if (endedAt.getTime() <= startedAt.getTime()) {
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
