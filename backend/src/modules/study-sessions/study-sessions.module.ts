import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { CoursesModule } from '../courses/courses.module';
import { TopicsModule } from '../topics/topics.module';
import { UsersModule } from '../users/users.module';
import { StudySession, StudySessionSchema } from './schemas/study-session.schema';
import { StudySessionsController } from './study-sessions.controller';
import { StudySessionsService } from './study-sessions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudySession.name, schema: StudySessionSchema },
      { name: Course.name, schema: CourseSchema }
    ]),
    forwardRef(() => CoursesModule),
    forwardRef(() => TopicsModule),
    UsersModule
  ],
  controllers: [StudySessionsController],
  providers: [StudySessionsService],
  exports: [StudySessionsService]
})
export class StudySessionsModule {}
