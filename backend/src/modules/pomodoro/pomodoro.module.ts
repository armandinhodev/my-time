import { Module } from '@nestjs/common';

import { CoursesModule } from '../courses/courses.module';
import { TopicsModule } from '../topics/topics.module';
import { StudySessionsModule } from '../study-sessions/study-sessions.module';
import { UsersModule } from '../users/users.module';
import { PomodoroController } from './pomodoro.controller';
import { PomodoroService } from './pomodoro.service';

@Module({
  imports: [CoursesModule, TopicsModule, StudySessionsModule, UsersModule],
  controllers: [PomodoroController],
  providers: [PomodoroService]
})
export class PomodoroModule {}
