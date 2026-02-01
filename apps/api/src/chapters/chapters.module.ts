import { Module } from '@nestjs/common';
import { ChaptersController } from './chapters.controller';
import { ScheduledChaptersController } from './scheduled-chapters.controller';
import { ChaptersService } from './chapters.service';
import { StoriesModule } from '../stories';

@Module({
  imports: [StoriesModule],
  controllers: [ChaptersController, ScheduledChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
