import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { NotificationsService } from '../notifications';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(authorId: string, dto: CreateReviewDto) {
    // Check if story exists
    const story = await this.prisma.story.findUnique({
      where: { id: dto.storyId },
      select: { id: true, authorId: true, title: true },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Users cannot review their own stories
    if (story.authorId === authorId) {
      throw new ForbiddenException('You cannot review your own story');
    }

    // Check if user already reviewed this story
    const existingReview = await this.prisma.review.findUnique({
      where: {
        authorId_storyId: {
          authorId,
          storyId: dto.storyId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this story');
    }

    // Create the review
    const review = await this.prisma.review.create({
      data: {
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        authorId,
        storyId: dto.storyId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update story's review count and average rating
    await this.updateStoryRating(dto.storyId);

    // Notify the story author
    const reviewer = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { displayName: true, username: true },
    });

    await this.notificationsService.create(
      story.authorId,
      'NEW_REVIEW',
      `${reviewer?.displayName || reviewer?.username} left a ${dto.rating}-star review on "${story.title}"`,
      {
        storyId: story.id,
        reviewId: review.id,
        reviewerId: authorId,
      },
    );

    return review;
  }

  async findByStory(storyId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 10, 50);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { storyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where: { storyId } }),
    ]);

    // Get rating distribution
    const ratingDistribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { storyId },
      _count: { rating: true },
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratingDistribution) {
      distribution[r.rating] = r._count.rating;
    }

    return {
      reviews,
      ratingDistribution: distribution,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        story: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async findUserReviewForStory(userId: string, storyId: string) {
    return this.prisma.review.findUnique({
      where: {
        authorId_storyId: {
          authorId: userId,
          storyId,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update story's average rating if rating changed
    if (dto.rating !== undefined && dto.rating !== review.rating) {
      await this.updateStoryRating(review.storyId);
    }

    return updated;
  }

  async delete(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        story: { select: { authorId: true } },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Allow deletion if user is review author or story author
    const canDelete = review.authorId === userId || review.story.authorId === userId;

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this review');
    }

    const storyId = review.storyId;

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    // Update story's rating
    await this.updateStoryRating(storyId);

    return { success: true };
  }

  private async updateStoryRating(storyId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { storyId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.story.update({
      where: { id: storyId },
      data: {
        avgRating: stats._avg.rating,
        reviewCount: stats._count.id,
      },
    });
  }
}
