import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EmailService } from '../email';

type NotificationType = 'NEW_CHAPTER' | 'NEW_FOLLOWER' | 'COMMENT_ON_STORY' | 'COMMENT_REPLY' | 'STORY_LIKE' | 'NEW_REVIEW' | 'NEW_TIP';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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

  // Notification creators with email support
  async createFollowerNotification(userId: string, followerId: string) {
    const [user, follower] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      }),
      this.prisma.user.findUnique({
        where: { id: followerId },
        select: { username: true, displayName: true },
      }),
    ]);

    if (!follower) return;

    const name = follower.displayName || follower.username;
    await this.create(
      userId,
      'NEW_FOLLOWER',
      `${name} started following you`,
      { followerId },
    );

    // Send email notification
    if (user?.email) {
      this.emailService.sendNewFollowerEmail(
        user.email,
        follower.username,
        follower.displayName || follower.username,
      );
    }
  }

  async createNewChapterNotification(storyId: string, chapterId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: {
        title: true,
        author: {
          select: { username: true, displayName: true },
        },
      },
    });

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { title: true, chapterNumber: true },
    });

    if (!story || !chapter) return;

    // Get all followers who want notifications
    const followers = await this.prisma.storyFollow.findMany({
      where: { storyId, notifyUpdates: true },
      select: {
        userId: true,
        user: {
          select: { email: true },
        },
      },
    });

    const authorName = story.author.displayName || story.author.username;

    // Create notifications and send emails for all followers
    await Promise.all(
      followers.map(async (follower: { userId: string; user: { email: string } }) => {
        await this.create(
          follower.userId,
          'NEW_CHAPTER',
          `New chapter in "${story.title}": Chapter ${chapter.chapterNumber} - ${chapter.title}`,
          { storyId, chapterId },
        );

        // Send email
        if (follower.user.email) {
          this.emailService.sendNewChapterEmail(
            follower.user.email,
            story.title,
            chapter.title,
            chapter.chapterNumber,
            authorName,
            storyId,
            chapterId,
          );
        }
      }),
    );
  }

  async createCommentNotification(
    authorId: string,
    commenterId: string,
    storyId: string,
    storyTitle: string,
    commentContent?: string,
  ) {
    if (authorId === commenterId) return;

    const [author, commenter] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: authorId },
        select: { email: true },
      }),
      this.prisma.user.findUnique({
        where: { id: commenterId },
        select: { username: true, displayName: true },
      }),
    ]);

    if (!commenter) return;

    const name = commenter.displayName || commenter.username;
    await this.create(
      authorId,
      'COMMENT_ON_STORY',
      `${name} commented on "${storyTitle}"`,
      { storyId, commenterId },
    );

    // Send email notification
    if (author?.email && commentContent) {
      this.emailService.sendCommentEmail(
        author.email,
        name,
        storyTitle,
        commentContent,
        storyId,
      );
    }
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
      'COMMENT_REPLY',
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
      'STORY_LIKE',
      `${name} liked "${storyTitle}"`,
      { storyId, likerId },
    );
  }

  async createReviewNotification(
    authorId: string,
    reviewerId: string,
    storyId: string,
    storyTitle: string,
    rating: number,
    reviewContent: string,
  ) {
    if (authorId === reviewerId) return;

    const [author, reviewer] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: authorId },
        select: { email: true },
      }),
      this.prisma.user.findUnique({
        where: { id: reviewerId },
        select: { username: true, displayName: true },
      }),
    ]);

    if (!reviewer) return;

    const name = reviewer.displayName || reviewer.username;
    await this.create(
      authorId,
      'NEW_REVIEW',
      `${name} reviewed "${storyTitle}" (${rating}/5)`,
      { storyId, reviewerId, rating },
    );

    // Send email notification
    if (author?.email) {
      this.emailService.sendReviewEmail(
        author.email,
        name,
        storyTitle,
        rating,
        reviewContent,
        storyId,
      );
    }
  }

  async createTipNotification(
    authorId: string,
    tipperId: string,
    amount: number,
    storyTitle: string | null,
    message: string | null,
  ) {
    const [author, tipper] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: authorId },
        select: { email: true },
      }),
      this.prisma.user.findUnique({
        where: { id: tipperId },
        select: { username: true, displayName: true },
      }),
    ]);

    if (!tipper) return;

    const name = tipper.displayName || tipper.username;
    const formattedAmount = `$${(amount / 100).toFixed(2)}`;
    const storyPart = storyTitle ? ` for "${storyTitle}"` : '';

    await this.create(
      authorId,
      'NEW_TIP',
      `${name} sent you ${formattedAmount}${storyPart}`,
      { tipperId, amount, storyTitle },
    );

    // Send email notification
    if (author?.email) {
      this.emailService.sendTipEmail(
        author.email,
        name,
        amount,
        storyTitle,
        message,
      );
    }
  }
}
