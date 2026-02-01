import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChaptersService } from '../chapters';
import { NotificationsService } from '../notifications';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private chaptersService: ChaptersService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Scheduler service initialized');
  }

  // Run every minute to check for scheduled chapters
  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledChapters() {
    try {
      const published = await this.chaptersService.publishScheduledChapters();

      if (published.length > 0) {
        this.logger.log(`Published ${published.length} scheduled chapters`);

        // Send notifications for newly published chapters
        for (const chapter of published) {
          await this.notificationsService.createNewChapterNotification(
            chapter.storyId,
            chapter.chapterId,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error publishing scheduled chapters', error);
    }
  }
}
