import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { StoriesService } from '../stories';
import { CreateChapterDto, UpdateChapterDto } from './dto';

@Injectable()
export class ChaptersService {
  constructor(
    private prisma: PrismaService,
    private storiesService: StoriesService,
  ) {}

  async create(storyId: string, userId: string, dto: CreateChapterDto) {
    // Verify story exists and user is author
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException('You can only add chapters to your own stories');
    }

    // Get next chapter number
    const lastChapter = await this.prisma.chapter.findFirst({
      where: { storyId },
      orderBy: { chapterNumber: 'desc' },
    });

    const chapterNumber = (lastChapter?.chapterNumber || 0) + 1;

    // Calculate word count
    const wordCount = this.countWords(dto.content);

    const chapter = await this.prisma.chapter.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorNotesBefore: dto.authorNotesBefore,
        authorNotesAfter: dto.authorNotesAfter,
        storyId,
        chapterNumber,
        wordCount,
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
        scheduledPublishAt: dto.scheduledPublishAt ? new Date(dto.scheduledPublishAt) : null,
      },
    });

    // Update story word count
    await this.storiesService.updateWordCount(storyId);

    return chapter;
  }

  async findAllByStory(storyId: string, userId?: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const isAuthor = story.authorId === userId;

    const chapters = await this.prisma.chapter.findMany({
      where: {
        storyId,
        ...(!isAuthor && { isPublished: true }),
      },
      orderBy: { chapterNumber: 'asc' },
      select: {
        id: true,
        title: true,
        chapterNumber: true,
        wordCount: true,
        isPublished: true,
        publishedAt: true,
        scheduledPublishAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return chapters;
  }

  async findOne(storyId: string, chapterId: string, userId?: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            authorId: true,
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

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    // Check if unpublished and not author
    if (!chapter.isPublished && chapter.story.authorId !== userId) {
      throw new NotFoundException('Chapter not found');
    }

    // Get prev/next chapter info
    const [prevChapter, nextChapter] = await Promise.all([
      this.prisma.chapter.findFirst({
        where: {
          storyId,
          chapterNumber: { lt: chapter.chapterNumber },
          ...(chapter.story.authorId !== userId && { isPublished: true }),
        },
        orderBy: { chapterNumber: 'desc' },
        select: { id: true, title: true, chapterNumber: true },
      }),
      this.prisma.chapter.findFirst({
        where: {
          storyId,
          chapterNumber: { gt: chapter.chapterNumber },
          ...(chapter.story.authorId !== userId && { isPublished: true }),
        },
        orderBy: { chapterNumber: 'asc' },
        select: { id: true, title: true, chapterNumber: true },
      }),
    ]);

    return {
      ...chapter,
      prevChapter,
      nextChapter,
    };
  }

  async update(
    storyId: string,
    chapterId: string,
    userId: string,
    dto: UpdateChapterDto,
  ) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, storyId },
      include: { story: true },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (chapter.story.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own chapters');
    }

    const updateData: any = { ...dto };

    // Recalculate word count if content changed
    if (dto.content) {
      updateData.wordCount = this.countWords(dto.content);
    }

    // Set publishedAt if publishing for first time
    if (dto.isPublished && !chapter.isPublished) {
      updateData.publishedAt = new Date();
      updateData.scheduledPublishAt = null; // Clear schedule if publishing now
    }

    // Handle scheduled publishing
    if (dto.scheduledPublishAt !== undefined) {
      updateData.scheduledPublishAt = dto.scheduledPublishAt ? new Date(dto.scheduledPublishAt) : null;
    }

    const updatedChapter = await this.prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
    });

    // Update story word count
    await this.storiesService.updateWordCount(storyId);

    return updatedChapter;
  }

  async delete(storyId: string, chapterId: string, userId: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, storyId },
      include: { story: true },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (chapter.story.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own chapters');
    }

    await this.prisma.chapter.delete({
      where: { id: chapterId },
    });

    // Renumber remaining chapters
    await this.renumberChapters(storyId, chapter.chapterNumber);

    // Update story word count
    await this.storiesService.updateWordCount(storyId);

    return { success: true };
  }

  async reorder(storyId: string, userId: string, chapterIds: string[]) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException('You can only reorder your own chapters');
    }

    // Update each chapter's order
    await Promise.all(
      chapterIds.map((id, index) =>
        this.prisma.chapter.update({
          where: { id },
          data: { chapterNumber: index + 1 },
        }),
      ),
    );

    return this.findAllByStory(storyId, userId);
  }

  private async renumberChapters(storyId: string, deletedNumber: number) {
    await this.prisma.chapter.updateMany({
      where: {
        storyId,
        chapterNumber: { gt: deletedNumber },
      },
      data: {
        chapterNumber: { decrement: 1 },
      },
    });
  }

  async publishScheduledChapters() {
    const now = new Date();

    // Find all chapters that are scheduled to be published
    const scheduledChapters = await this.prisma.chapter.findMany({
      where: {
        isPublished: false,
        scheduledPublishAt: {
          lte: now,
        },
      },
      include: {
        story: {
          select: { id: true, title: true },
        },
      },
    });

    const results = [];

    for (const chapter of scheduledChapters) {
      // Publish the chapter
      await this.prisma.chapter.update({
        where: { id: chapter.id },
        data: {
          isPublished: true,
          publishedAt: now,
          scheduledPublishAt: null,
        },
      });

      // Update story word count
      await this.storiesService.updateWordCount(chapter.storyId);

      results.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        storyId: chapter.storyId,
        storyTitle: chapter.story.title,
      });
    }

    return results;
  }

  async getScheduledChapters(userId: string) {
    return this.prisma.chapter.findMany({
      where: {
        story: { authorId: userId },
        isPublished: false,
        scheduledPublishAt: { not: null },
      },
      include: {
        story: {
          select: { id: true, title: true },
        },
      },
      orderBy: { scheduledPublishAt: 'asc' },
    });
  }

  private countWords(text: string): number {
    // Strip HTML tags if present
    const plainText = text.replace(/<[^>]*>/g, ' ');
    // Split by whitespace and filter empty strings
    const words = plainText.split(/\s+/).filter((word) => word.length > 0);
    return words.length;
  }
}
