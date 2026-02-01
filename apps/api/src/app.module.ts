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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
