import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { RecordStoryViewDto, RecordChapterViewDto, UpdateChapterViewDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Record views
  async recordStoryView(userId: string | null, dto: RecordStoryViewDto) {
    const story = await this.prisma.story.findUnique({
      where: { id: dto.storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Create view record
    const view = await this.prisma.storyView.create({
      data: {
        storyId: dto.storyId,
        userId: userId || null,
        country: dto.country,
        referrer: dto.referrer,
        deviceType: dto.deviceType,
      },
    });

    // Increment story view count
    await this.prisma.story.update({
      where: { id: dto.storyId },
      data: { viewCount: { increment: 1 } },
    });

    return view;
  }

  async recordChapterView(userId: string | null, dto: RecordChapterViewDto) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: dto.chapterId },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return this.prisma.chapterView.create({
      data: {
        chapterId: dto.chapterId,
        userId: userId || null,
        readingTime: dto.readingTime,
        scrollDepth: dto.scrollDepth,
        country: dto.country,
        referrer: dto.referrer,
        deviceType: dto.deviceType,
      },
    });
  }

  async updateChapterView(dto: UpdateChapterViewDto) {
    const view = await this.prisma.chapterView.findUnique({
      where: { id: dto.viewId },
    });

    if (!view) {
      throw new NotFoundException('View not found');
    }

    return this.prisma.chapterView.update({
      where: { id: dto.viewId },
      data: {
        readingTime: dto.readingTime ?? view.readingTime,
        scrollDepth: dto.scrollDepth ?? view.scrollDepth,
        completedAt: dto.completed ? new Date() : view.completedAt,
      },
    });
  }

  // Dashboard stats for authors
  async getDashboardStats(authorId: string) {
    // Get all stories by this author
    const stories = await this.prisma.story.findMany({
      where: { authorId },
      select: { id: true },
    });

    const storyIds = stories.map((s) => s.id);

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);

    const [totalViews, todayViews, weekViews, monthViews, totalFollowers, totalLikes, totalReviews] =
      await Promise.all([
        this.prisma.storyView.count({
          where: { storyId: { in: storyIds } },
        }),
        this.prisma.storyView.count({
          where: { storyId: { in: storyIds }, viewedAt: { gte: startOfToday } },
        }),
        this.prisma.storyView.count({
          where: { storyId: { in: storyIds }, viewedAt: { gte: startOfWeek } },
        }),
        this.prisma.storyView.count({
          where: { storyId: { in: storyIds }, viewedAt: { gte: startOfMonth } },
        }),
        this.prisma.userFollow.count({
          where: { followingId: authorId },
        }),
        this.prisma.like.count({
          where: { storyId: { in: storyIds } },
        }),
        this.prisma.review.count({
          where: { storyId: { in: storyIds } },
        }),
      ]);

    return {
      totalViews,
      todayViews,
      weekViews,
      monthViews,
      totalFollowers,
      totalLikes,
      totalReviews,
      storyCount: stories.length,
    };
  }

  async getStoryAnalytics(authorId: string, storyId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== authorId) {
      throw new ForbiddenException('You can only view analytics for your own stories');
    }

    // Get view trends for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsByDay = await this.prisma.$queryRaw`
      SELECT DATE(viewed_at) as date, COUNT(*) as views
      FROM story_views
      WHERE story_id = ${storyId} AND viewed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(viewed_at)
      ORDER BY date
    ` as any[];

    // Get device breakdown
    const deviceBreakdown = await this.prisma.storyView.groupBy({
      by: ['deviceType'],
      where: { storyId },
      _count: { id: true },
    });

    // Get referrer breakdown
    const referrerBreakdown = await this.prisma.storyView.groupBy({
      by: ['referrer'],
      where: { storyId, referrer: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get country breakdown
    const countryBreakdown = await this.prisma.storyView.groupBy({
      by: ['country'],
      where: { storyId, country: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get chapter-level stats
    const chapters = await this.prisma.chapter.findMany({
      where: { storyId },
      select: {
        id: true,
        title: true,
        chapterNumber: true,
        wordCount: true,
        _count: { select: { views: true } },
      },
      orderBy: { chapterNumber: 'asc' },
    });

    // Get average reading time per chapter
    const chapterReadingStats = await this.prisma.chapterView.groupBy({
      by: ['chapterId'],
      where: {
        chapter: { storyId },
        readingTime: { not: null },
      },
      _avg: { readingTime: true, scrollDepth: true },
    });

    const chapterStatsMap = new Map(
      chapterReadingStats.map((s) => [s.chapterId, s])
    );

    const chapterStats = chapters.map((ch) => {
      const stats = chapterStatsMap.get(ch.id);
      return {
        id: ch.id,
        title: ch.title,
        chapterNumber: ch.chapterNumber,
        wordCount: ch.wordCount,
        views: ch._count.views,
        avgReadingTime: stats?._avg?.readingTime || null,
        avgScrollDepth: stats?._avg?.scrollDepth || null,
      };
    });

    return {
      story: {
        id: story.id,
        title: story.title,
        viewCount: story.viewCount,
        likeCount: story.likeCount,
        reviewCount: story.reviewCount,
      },
      viewsByDay,
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d.deviceType || 'unknown',
        count: d._count.id,
      })),
      referrerBreakdown: referrerBreakdown.map((r) => ({
        referrer: r.referrer || 'direct',
        count: r._count.id,
      })),
      countryBreakdown: countryBreakdown.map((c) => ({
        country: c.country || 'unknown',
        count: c._count.id,
      })),
      chapterStats,
    };
  }

  async getFollowerGrowth(authorId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const followers = await this.prisma.userFollow.findMany({
      where: {
        followingId: authorId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const growthByDay: Record<string, number> = {};
    followers.forEach((f) => {
      const date = f.createdAt.toISOString().split('T')[0];
      growthByDay[date] = (growthByDay[date] || 0) + 1;
    });

    return Object.entries(growthByDay).map(([date, count]) => ({ date, count }));
  }

  async getTopStories(authorId: string, limit = 5) {
    return this.prisma.story.findMany({
      where: { authorId },
      orderBy: { viewCount: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        reviewCount: true,
        avgRating: true,
      },
    });
  }
}
