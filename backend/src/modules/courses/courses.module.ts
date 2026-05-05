import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StudySessionsModule } from '../study-sessions/study-sessions.module';
import { TopicsModule } from '../topics/topics.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course, CourseSchema } from './schemas/course.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]), forwardRef(() => TopicsModule), forwardRef(() => StudySessionsModule)],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService]
})
export class CoursesModule {}
