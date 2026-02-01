import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RecordStoryViewDto, RecordChapterViewDto, UpdateChapterViewDto } from './dto';
import { JwtAuthGuard, OptionalJwtAuthGuard, CurrentUser, Public } from '../auth';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // Record views (can be called by anyone, logged in or not)
  @UseGuards(OptionalJwtAuthGuard)
  @Post('views/story')
  async recordStoryView(
    @CurrentUser('id') userId: string | undefined,
    @Body() dto: RecordStoryViewDto,
  ) {
    return this.analyticsService.recordStoryView(userId || null, dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('views/chapter')
  async recordChapterView(
    @CurrentUser('id') userId: string | undefined,
    @Body() dto: RecordChapterViewDto,
  ) {
    return this.analyticsService.recordChapterView(userId || null, dto);
  }

  @Public()
  @Put('views/chapter')
  async updateChapterView(@Body() dto: UpdateChapterViewDto) {
    return this.analyticsService.updateChapterView(dto);
  }

  // Author dashboard endpoints
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.analyticsService.getDashboardStats(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stories/:storyId')
  async getStoryAnalytics(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.analyticsService.getStoryAnalytics(userId, storyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('followers/growth')
  async getFollowerGrowth(
    @CurrentUser('id') userId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getFollowerGrowth(
      userId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('top-stories')
  async getTopStories(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopStories(
      userId,
      limit ? parseInt(limit, 10) : 5,
    );
  }
}
