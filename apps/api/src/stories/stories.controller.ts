import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto, UpdateStoryDto } from './dto';
import { JwtAuthGuard, CurrentUser, Public } from '../auth';

type StoryStatus = 'DRAFT' | 'ONGOING' | 'COMPLETED' | 'HIATUS';

@Controller('stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStoryDto,
  ) {
    return this.storiesService.create(userId, dto);
  }

  @Public()
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: StoryStatus,
    @Query('search') search?: string,
    @Query('minWordCount') minWordCount?: string,
    @Query('maxWordCount') maxWordCount?: string,
    @Query('minChapters') minChapters?: string,
    @Query('maxChapters') maxChapters?: string,
    @Query('contentRating') contentRating?: string,
    @Query('tagIds') tagIds?: string,
    @Query('excludeTagIds') excludeTagIds?: string,
    @Query('minRating') minRating?: string,
    @Query('sortBy') sortBy?: 'newest' | 'popular' | 'views' | 'rating' | 'updated',
    @Query('completedOnly') completedOnly?: string,
    @Query('ongoingOnly') ongoingOnly?: string,
  ) {
    return this.storiesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
      minWordCount: minWordCount ? parseInt(minWordCount, 10) : undefined,
      maxWordCount: maxWordCount ? parseInt(maxWordCount, 10) : undefined,
      minChapters: minChapters ? parseInt(minChapters, 10) : undefined,
      maxChapters: maxChapters ? parseInt(maxChapters, 10) : undefined,
      contentRating,
      tagIds: tagIds ? tagIds.split(',') : undefined,
      excludeTagIds: excludeTagIds ? excludeTagIds.split(',') : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      completedOnly: completedOnly === 'true',
      ongoingOnly: ongoingOnly === 'true',
    });
  }

  @Public()
  @Get(':id/similar')
  async getSimilarStories(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.storiesService.getSimilarStories(id, limit ? parseInt(limit, 10) : 5);
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.storiesService.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateStoryDto,
  ) {
    return this.storiesService.update(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  async publish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.publish(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.delete(id, userId);
  }

  @Public()
  @Get('author/:authorId')
  async findByAuthor(
    @Param('authorId') authorId: string,
    @CurrentUser('id') requestingUserId?: string,
  ) {
    return this.storiesService.findByAuthor(authorId, requestingUserId);
  }
}
