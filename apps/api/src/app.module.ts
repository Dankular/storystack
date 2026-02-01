import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { UsersModule } from './users';
import { StoriesModule } from './stories';
import { ChaptersModule } from './chapters';
import { TagsModule } from './tags';
import { CommentsModule } from './comments';
import { FollowsModule } from './follows';
import { NotificationsModule } from './notifications';
import { ReadingListsModule } from './reading-lists';
import { ReviewsModule } from './reviews';
import { MonetisationModule } from './monetisation';
import { AnalyticsModule } from './analytics';
import { SearchModule } from './search';
import { ExportModule } from './export';
import { SchedulerModule } from './scheduler';
import { ReadingHistoryModule } from './reading-history';
import { ModerationModule } from './moderation';
import { ImportExportModule } from './import-export';
import { CollaboratorsModule } from './collaborators';
import { InlineCommentsModule } from './inline-comments';
import { EmailModule } from './email';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StoriesModule,
    ChaptersModule,
    TagsModule,
    CommentsModule,
    NotificationsModule,
    FollowsModule,
    ReadingListsModule,
    ReviewsModule,
    MonetisationModule,
    AnalyticsModule,
    SearchModule,
    ExportModule,
    SchedulerModule,
    ReadingHistoryModule,
    ModerationModule,
    ImportExportModule,
    CollaboratorsModule,
    InlineCommentsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
