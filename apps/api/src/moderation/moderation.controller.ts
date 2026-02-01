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
import { ModerationService } from './moderation.service';
import { JwtAuthGuard, CurrentUser } from '../auth';
import { ReportReason } from '@prisma/client';

class CreateReportDto {
  reason: ReportReason;
  description?: string;
  storyId?: string;
  userId?: string;
  commentId?: string;
  reviewId?: string;
}

@Controller()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // Block endpoints
  @UseGuards(JwtAuthGuard)
  @Post('users/:userId/block')
  async blockUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') userId: string,
  ) {
    return this.moderationService.blockUser(currentUserId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/:userId/block')
  async unblockUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') userId: string,
  ) {
    return this.moderationService.unblockUser(currentUserId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/blocked-users')
  async getBlockedUsers(@CurrentUser('id') userId: string) {
    return this.moderationService.getBlockedUsers(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/:userId/is-blocked')
  async isBlocked(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') userId: string,
  ) {
    return this.moderationService.isBlocked(currentUserId, userId);
  }

  // Report endpoints
  @UseGuards(JwtAuthGuard)
  @Post('reports')
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.createReport(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/reports')
  async getMyReports(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.moderationService.getMyReports(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
