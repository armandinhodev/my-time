import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CoursesModule } from '../courses/courses.module';
import { StudySessionsModule } from '../study-sessions/study-sessions.module';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]), forwardRef(() => CoursesModule), forwardRef(() => StudySessionsModule)],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService]
})
export class TopicsModule {}
