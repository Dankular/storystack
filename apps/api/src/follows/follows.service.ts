import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { NotificationsService } from '../notifications';

@Injectable()
export class FollowsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // User follows
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      throw new ConflictException('Already following this user');
    }

    const follow = await this.prisma.userFollow.create({
      data: { followerId, followingId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Send notification
    await this.notificationsService.createFollowerNotification(
      followingId,
      followerId,
    );

    return follow;
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this user');
    }

    await this.prisma.userFollow.delete({
      where: { id: follow.id },
    });

    return { success: true };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
      this.prisma.userFollow.count({ where: { followingId: userId } }),
    ]);

    return {
      users: followers.map((f) => f.follower),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
      this.prisma.userFollow.count({ where: { followerId: userId } }),
    ]);

    return {
      users: following.map((f) => f.following),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return { isFollowing: !!follow };
  }

  // Story follows
  async followStory(userId: string, storyId: string, notifyUpdates = true) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const existing = await this.prisma.storyFollow.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });

    if (existing) {
      throw new ConflictException('Already following this story');
    }

    return this.prisma.storyFollow.create({
      data: { userId, storyId, notifyUpdates },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async unfollowStory(userId: string, storyId: string) {
    const follow = await this.prisma.storyFollow.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this story');
    }

    await this.prisma.storyFollow.delete({
      where: { id: follow.id },
    });

    return { success: true };
  }

  async getFollowedStories(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.storyFollow.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          story: {
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
                include: { tag: true },
              },
            },
          },
        },
      }),
      this.prisma.storyFollow.count({ where: { userId } }),
    ]);

    return {
      stories: follows.map((f) => ({
        ...f.story,
        tags: f.story.tags.map((st) => st.tag),
        followedAt: f.createdAt,
        notifyUpdates: f.notifyUpdates,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async isFollowingStory(userId: string, storyId: string) {
    const follow = await this.prisma.storyFollow.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });
    return {
      isFollowing: !!follow,
      notifyUpdates: follow?.notifyUpdates ?? false,
    };
  }

  async updateStoryFollowSettings(
    userId: string,
    storyId: string,
    notifyUpdates: boolean,
  ) {
    const follow = await this.prisma.storyFollow.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this story');
    }

    return this.prisma.storyFollow.update({
      where: { id: follow.id },
      data: { notifyUpdates },
    });
  }
}
