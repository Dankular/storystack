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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { JwtAuthGuard, CurrentUser, Public, OptionalJwtAuthGuard } from '../auth';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, dto);
  }

  @Public()
  @Get('story/:storyId')
  async findByStory(
    @Param('storyId') storyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.findByStory(storyId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('story/:storyId/my-review')
  async getMyReview(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId?: string,
  ) {
    if (!userId) {
      return null;
    }
    return this.reviewsService.findUserReviewForStory(userId, storyId);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.reviewsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.delete(id, userId);
  }
}
