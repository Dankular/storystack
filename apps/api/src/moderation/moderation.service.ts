import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ReportReason } from '@prisma/client';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  // Block/Unblock users
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    // Check if user exists
    const blockedUser = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });

    if (!blockedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const existingBlock = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (existingBlock) {
      throw new ConflictException('User already blocked');
    }

    // Create block
    await this.prisma.userBlock.create({
      data: { blockerId, blockedId },
    });

    // Remove any follows between these users
    await this.prisma.userFollow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });

    return { success: true };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (!block) {
      throw new NotFoundException('User not blocked');
    }

    await this.prisma.userBlock.delete({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    return { success: true };
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((b) => ({
      ...b.blocked,
      blockedAt: b.createdAt,
    }));
  }

  async isBlocked(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });
    return { isBlocked: !!block };
  }

  async isBlockedByOrBlocking(userId1: string, userId2: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });
    return blocks.length > 0;
  }

  // Reports
  async createReport(
    reporterId: string,
    data: {
      reason: ReportReason;
      description?: string;
      storyId?: string;
      userId?: string;
      commentId?: string;
      reviewId?: string;
    },
  ) {
    // Validate that at least one target is provided
    if (!data.storyId && !data.userId && !data.commentId && !data.reviewId) {
      throw new BadRequestException('Report must specify a target');
    }

    // Verify the target exists
    if (data.storyId) {
      const story = await this.prisma.story.findUnique({ where: { id: data.storyId } });
      if (!story) throw new NotFoundException('Story not found');
    }
    if (data.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new NotFoundException('User not found');
      if (data.userId === reporterId) throw new BadRequestException('You cannot report yourself');
    }
    if (data.commentId) {
      const comment = await this.prisma.comment.findUnique({ where: { id: data.commentId } });
      if (!comment) throw new NotFoundException('Comment not found');
    }
    if (data.reviewId) {
      const review = await this.prisma.review.findUnique({ where: { id: data.reviewId } });
      if (!review) throw new NotFoundException('Review not found');
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        reason: data.reason,
        description: data.description,
        storyId: data.storyId,
        userId: data.userId,
        commentId: data.commentId,
        reviewId: data.reviewId,
      },
    });
  }

  async getMyReports(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          story: { select: { id: true, title: true } },
        },
      }),
      this.prisma.report.count({ where: { reporterId: userId } }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
