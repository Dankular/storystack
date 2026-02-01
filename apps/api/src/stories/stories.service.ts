import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateStoryDto, UpdateStoryDto } from './dto';
import { StoryStatus, Prisma } from '@prisma/client';

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreateStoryDto) {
    const { tagIds, ...storyData } = dto;

    const story = await this.prisma.story.create({
      data: {
        ...storyData,
        authorId,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId) => ({
                tagId,
                addedByAuthor: true,
              })),
            }
          : undefined,
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatStoryResponse(story);
  }

  async findAll(options?: {
    authorId?: string;
    status?: StoryStatus;
    rating?: string;
    search?: string;
    page?: number;
    limit?: number;
    // Advanced filters
    minWordCount?: number;
    maxWordCount?: number;
    minChapters?: number;
    maxChapters?: number;
    contentRating?: string;
    tagIds?: string[];
    excludeTagIds?: string[];
    minRating?: number;
    sortBy?: 'newest' | 'popular' | 'views' | 'rating' | 'updated';
    completedOnly?: boolean;
    ongoingOnly?: boolean;
  }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.StoryWhereInput = {
      ...(options?.authorId && { authorId: options.authorId }),
      ...(options?.search && {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
      // Status filters
      ...(options?.completedOnly && { status: StoryStatus.COMPLETED }),
      ...(options?.ongoingOnly && { status: StoryStatus.ONGOING }),
      ...(options?.status && !options?.completedOnly && !options?.ongoingOnly && { status: options.status }),
      // Only show published stories unless filtered by author
      ...(!options?.authorId && !options?.status && !options?.completedOnly && !options?.ongoingOnly && { status: { not: StoryStatus.DRAFT } }),
      // Word count filters
      ...(options?.minWordCount && { wordCount: { gte: options.minWordCount } }),
      ...(options?.maxWordCount && { wordCount: { lte: options.maxWordCount } }),
      // Chapter count filters
      ...(options?.minChapters && { chapterCount: { gte: options.minChapters } }),
      ...(options?.maxChapters && { chapterCount: { lte: options.maxChapters } }),
      // Content rating filter
      ...(options?.contentRating && { rating: options.contentRating as any }),
      // Minimum average rating
      ...(options?.minRating && { avgRating: { gte: options.minRating } }),
      // Tag filters (include)
      ...(options?.tagIds?.length && {
        tags: {
          some: {
            tagId: { in: options.tagIds },
          },
        },
      }),
      // Tag filters (exclude)
      ...(options?.excludeTagIds?.length && {
        NOT: {
          tags: {
            some: {
              tagId: { in: options.excludeTagIds },
            },
          },
        },
      }),
    };

    // Determine sort order
    let orderBy: Prisma.StoryOrderByWithRelationInput = { updatedAt: 'desc' };
    switch (options?.sortBy) {
      case 'newest':
        orderBy = { publishedAt: 'desc' };
        break;
      case 'popular':
        orderBy = { likeCount: 'desc' };
        break;
      case 'views':
        orderBy = { viewCount: 'desc' };
        break;
      case 'rating':
        orderBy = { avgRating: 'desc' };
        break;
      case 'updated':
      default:
        orderBy = { updatedAt: 'desc' };
    }

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prisma.story.count({ where }),
    ]);

    return {
      stories: stories.map(this.formatStoryResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSimilarStories(storyId: string, limit = 5) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const tagIds = story.tags.map((t) => t.tagId);

    // Find stories with similar tags
    const similarStories = await this.prisma.story.findMany({
      where: {
        id: { not: storyId },
        status: { not: StoryStatus.DRAFT },
        tags: {
          some: {
            tagId: { in: tagIds },
          },
        },
      },
      orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return similarStories.map(this.formatStoryResponse);
  }

  async findOne(id: string, userId?: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        chapters: {
          where: { isPublished: true },
          orderBy: { chapterNumber: 'asc' },
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            wordCount: true,
            publishedAt: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Check if draft and not the author
    if (story.status === StoryStatus.DRAFT && story.authorId !== userId) {
      throw new NotFoundException('Story not found');
    }

    // Increment view count
    await this.prisma.story.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return this.formatStoryResponse(story);
  }

  async findByAuthor(authorId: string, requestingUserId?: string) {
    const isOwner = authorId === requestingUserId;

    const stories = await this.prisma.story.findMany({
      where: {
        authorId,
        ...(!isOwner && { status: { not: StoryStatus.DRAFT } }),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return stories.map(this.formatStoryResponse);
  }

  async update(id: string, userId: string, dto: UpdateStoryDto) {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own stories');
    }

    const { tagIds, ...updateData } = dto;

    // Handle tag updates
    if (tagIds !== undefined) {
      // Remove existing tags and add new ones
      await this.prisma.storyTag.deleteMany({
        where: { storyId: id },
      });

      if (tagIds.length > 0) {
        await this.prisma.storyTag.createMany({
          data: tagIds.map((tagId) => ({
            storyId: id,
            tagId,
            addedByAuthor: true,
          })),
        });
      }
    }

    const updatedStory = await this.prisma.story.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatStoryResponse(updatedStory);
  }

  async publish(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException('You can only publish your own stories');
    }

    const updatedStory = await this.prisma.story.update({
      where: { id },
      data: {
        status: StoryStatus.ONGOING,
        publishedAt: story.publishedAt || new Date(),
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatStoryResponse(updatedStory);
  }

  async delete(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }

    await this.prisma.story.delete({
      where: { id },
    });

    return { success: true };
  }

  async updateWordCount(storyId: string) {
    const chapters = await this.prisma.chapter.findMany({
      where: { storyId, isPublished: true },
      select: { wordCount: true },
    });

    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    const chapterCount = chapters.length;

    await this.prisma.story.update({
      where: { id: storyId },
      data: { wordCount: totalWordCount, chapterCount },
    });
  }

  private formatStoryResponse(story: any) {
    const { tags, _count, ...rest } = story;

    return {
      ...rest,
      tags: tags?.map((st: any) => st.tag) || [],
      likeCount: _count?.likes ?? story.likeCount ?? 0,
      commentCount: _count?.comments ?? 0,
    };
  }
}
