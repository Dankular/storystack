import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreateCommentDto) {
    // Validate that either storyId or chapterId is provided
    if (!dto.storyId && !dto.chapterId) {
      throw new BadRequestException('Either storyId or chapterId must be provided');
    }

    // If replying to a comment, verify parent exists
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
      // Use parent's story/chapter context
      dto.storyId = parent.storyId || undefined;
      dto.chapterId = parent.chapterId || undefined;
    }

    // Verify story or chapter exists
    if (dto.storyId) {
      const story = await this.prisma.story.findUnique({
        where: { id: dto.storyId },
      });
      if (!story) {
        throw new NotFoundException('Story not found');
      }
    }

    if (dto.chapterId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: dto.chapterId },
      });
      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId,
        storyId: dto.storyId,
        chapterId: dto.chapterId,
        parentId: dto.parentId,
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

    return comment;
  }

  async findByStory(storyId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          storyId,
          parentId: null, // Only top-level comments
        },
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
          replies: {
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
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: { storyId, parentId: null },
      }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByChapter(chapterId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          chapterId,
          parentId: null,
        },
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
          replies: {
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
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: { chapterId, parentId: null },
      }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
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

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        story: { select: { authorId: true } },
        chapter: { select: { story: { select: { authorId: true } } } },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Allow deletion if user is comment author or story author
    const storyAuthorId = comment.story?.authorId || comment.chapter?.story?.authorId;
    const canDelete = comment.authorId === userId || storyAuthorId === userId;

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    // Delete all replies first (cascade should handle this, but being explicit)
    await this.prisma.comment.deleteMany({
      where: { parentId: commentId },
    });

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }

  async getReplies(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.comment.findMany({
      where: { parentId: commentId },
      orderBy: { createdAt: 'asc' },
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
}
