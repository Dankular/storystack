import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class ReadingHistoryService {
  constructor(private prisma: PrismaService) {}

  async getReadingHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [progress, total] = await Promise.all([
      this.prisma.readingProgress.findMany({
        where: { userId },
        orderBy: { lastReadAt: 'desc' },
        skip,
        take: limit,
        include: {
          story: {
            select: {
              id: true,
              title: true,
              coverImageUrl: true,
              status: true,
              chapterCount: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          chapter: {
            select: {
              id: true,
              title: true,
              chapterNumber: true,
            },
          },
        },
      }),
      this.prisma.readingProgress.count({ where: { userId } }),
    ]);

    return {
      history: progress.map((p) => ({
        id: p.id,
        story: p.story,
        lastChapter: p.chapter,
        percentage: p.percentage,
        lastReadAt: p.lastReadAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateReadingProgress(
    userId: string,
    storyId: string,
    chapterId: string,
    data: { position?: number; percentage?: number },
  ) {
    return this.prisma.readingProgress.upsert({
      where: {
        userId_storyId: { userId, storyId },
      },
      update: {
        chapterId,
        position: data.position ?? 0,
        percentage: data.percentage ?? 0,
        lastReadAt: new Date(),
      },
      create: {
        userId,
        storyId,
        chapterId,
        position: data.position ?? 0,
        percentage: data.percentage ?? 0,
      },
    });
  }

  async getReadingProgress(userId: string, storyId: string) {
    return this.prisma.readingProgress.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            chapterNumber: true,
          },
        },
      },
    });
  }

  async removeFromHistory(userId: string, storyId: string) {
    await this.prisma.readingProgress.delete({
      where: {
        userId_storyId: { userId, storyId },
      },
    });
    return { success: true };
  }

  async clearHistory(userId: string) {
    await this.prisma.readingProgress.deleteMany({
      where: { userId },
    });
    return { success: true };
  }

  async getContinueReading(userId: string, limit = 5) {
    const progress = await this.prisma.readingProgress.findMany({
      where: {
        userId,
        percentage: { lt: 100 },
      },
      orderBy: { lastReadAt: 'desc' },
      take: limit,
      include: {
        story: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            status: true,
            chapterCount: true,
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        chapter: {
          select: {
            id: true,
            title: true,
            chapterNumber: true,
          },
        },
      },
    });

    return progress.map((p) => ({
      story: p.story,
      lastChapter: p.chapter,
      percentage: p.percentage,
      lastReadAt: p.lastReadAt,
    }));
  }
}
