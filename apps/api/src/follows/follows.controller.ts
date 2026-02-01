import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard, CurrentUser, Public } from '../auth';

@Controller()
export class FollowsController {
  constructor(private followsService: FollowsService) {}

  // User follows
  @UseGuards(JwtAuthGuard)
  @Post('users/:userId/follow')
  async followUser(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.followsService.followUser(followerId, followingId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/:userId/follow')
  async unfollowUser(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.followsService.unfollowUser(followerId, followingId);
  }

  @Public()
  @Get('users/:userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowers(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Public()
  @Get('users/:userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowing(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/:userId/is-following')
  async isFollowingUser(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.followsService.isFollowing(followerId, followingId);
  }

  // Story follows
  @UseGuards(JwtAuthGuard)
  @Post('stories/:storyId/follow')
  async followStory(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
    @Body('notifyUpdates') notifyUpdates?: boolean,
  ) {
    return this.followsService.followStory(userId, storyId, notifyUpdates ?? true);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('stories/:storyId/follow')
  async unfollowStory(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.followsService.unfollowStory(userId, storyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stories/:storyId/is-following')
  async isFollowingStory(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.followsService.isFollowingStory(userId, storyId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('stories/:storyId/follow')
  async updateStoryFollow(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
    @Body('notifyUpdates') notifyUpdates: boolean,
  ) {
    return this.followsService.updateStoryFollowSettings(userId, storyId, notifyUpdates);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/followed-stories')
  async getMyFollowedStories(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowedStories(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
