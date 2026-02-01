import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReadingHistoryService } from './reading-history.service';
import { JwtAuthGuard, CurrentUser } from '../auth';

@Controller('reading-history')
export class ReadingHistoryController {
  constructor(private readonly readingHistoryService: ReadingHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.readingHistoryService.getReadingHistory(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('continue')
  async getContinueReading(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.readingHistoryService.getContinueReading(
      userId,
      limit ? parseInt(limit) : 5,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('stories/:storyId')
  async getProgress(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.readingHistoryService.getReadingProgress(userId, storyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stories/:storyId/chapters/:chapterId')
  async updateProgress(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
    @Param('chapterId') chapterId: string,
    @Body() data: { position?: number; percentage?: number },
  ) {
    return this.readingHistoryService.updateReadingProgress(
      userId,
      storyId,
      chapterId,
      data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('stories/:storyId')
  async removeFromHistory(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.readingHistoryService.removeFromHistory(userId, storyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async clearHistory(@CurrentUser('id') userId: string) {
    return this.readingHistoryService.clearHistory(userId);
  }
}
