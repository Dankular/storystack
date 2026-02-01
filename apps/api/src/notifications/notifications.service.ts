import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    type: NotificationType,
    message: string,
    data?: any,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        data,
      },
    });
  }

  async getAll(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  async delete(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  async deleteAll(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return { success: true };
  }

  // Notification creators
  async createFollowerNotification(userId: string, followerId: string) {
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true, displayName: true },
    });

    if (!follower) return;

    const name = follower.displayName || follower.username;
    await this.create(
      userId,
      NotificationType.NEW_FOLLOWER,
      `${name} started following you`,
      { followerId },
    );
  }

  async createNewChapterNotification(storyId: string, chapterId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { title: true },
    });

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { title: true, chapterNumber: true },
    });

    if (!story || !chapter) return;

    // Get all followers who want notifications
    const followers = await this.prisma.storyFollow.findMany({
      where: { storyId, notifyUpdates: true },
      select: { userId: true },
    });

    // Create notifications for all followers
    await Promise.all(
      followers.map((follower) =>
        this.create(
          follower.userId,
          NotificationType.NEW_CHAPTER,
          `New chapter in "${story.title}": Chapter ${chapter.chapterNumber} - ${chapter.title}`,
          { storyId, chapterId },
        ),
      ),
    );
  }

  async createCommentNotification(
    authorId: string,
    commenterId: string,
    storyId: string,
    storyTitle: string,
  ) {
    if (authorId === commenterId) return;

    const commenter = await this.prisma.user.findUnique({
      where: { id: commenterId },
      select: { username: true, displayName: true },
    });

    if (!commenter) return;

    const name = commenter.displayName || commenter.username;
    await this.create(
      authorId,
      NotificationType.COMMENT_ON_STORY,
      `${name} commented on "${storyTitle}"`,
      { storyId, commenterId },
    );
  }

  async createReplyNotification(
    originalCommenterId: string,
    replierId: string,
    storyId: string,
  ) {
    if (originalCommenterId === replierId) return;

    const replier = await this.prisma.user.findUnique({
      where: { id: replierId },
      select: { username: true, displayName: true },
    });

    if (!replier) return;

    const name = replier.displayName || replier.username;
    await this.create(
      originalCommenterId,
      NotificationType.COMMENT_REPLY,
      `${name} replied to your comment`,
      { storyId, replierId },
    );
  }

  async createLikeNotification(
    authorId: string,
    likerId: string,
    storyId: string,
    storyTitle: string,
  ) {
    if (authorId === likerId) return;

    const liker = await this.prisma.user.findUnique({
      where: { id: likerId },
      select: { username: true, displayName: true },
    });

    if (!liker) return;

    const name = liker.displayName || liker.username;
    await this.create(
      authorId,
      NotificationType.STORY_LIKE,
      `${name} liked "${storyTitle}"`,
      { storyId, likerId },
    );
  }
}
