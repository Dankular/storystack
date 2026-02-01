import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ChaptersModule } from '../chapters';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ChaptersModule,
    NotificationsModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
