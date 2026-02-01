import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';

interface ImportedChapter {
  title: string;
  content: string;
  authorNotesBefore?: string;
  authorNotesAfter?: string;
}

interface ImportedStory {
  title: string;
  description?: string;
  chapters: ImportedChapter[];
  tags?: string[];
  rating?: string;
  status?: string;
}

interface ExportedStory {
  version: string;
  exportedAt: string;
  story: {
    title: string;
    description: string;
    status: string;
    rating: string;
    tags: string[];
    wordCount: number;
    author: {
      username: string;
      displayName: string | null;
    };
    chapters: {
      title: string;
      content: string;
      chapterNumber: number;
      wordCount: number;
      authorNotesBefore: string | null;
      authorNotesAfter: string | null;
      publishedAt: string | null;
    }[];
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
  };
}

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) {}

  async exportStory(storyId: string, userId: string): Promise<ExportedStory> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: { username: true, displayName: true },
        },
        tags: {
          include: { tag: true },
        },
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Only allow author to export their own stories
    if (story.authorId !== userId) {
      throw new BadRequestException('You can only export your own stories');
    }

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      story: {
        title: story.title,
        description: story.description,
        status: story.status,
        rating: story.rating,
        tags: story.tags.map((t) => t.tag.canonicalName),
        wordCount: story.wordCount,
        author: {
          username: story.author.username,
          displayName: story.author.displayName,
        },
        chapters: story.chapters.map((ch) => ({
          title: ch.title,
          content: ch.content,
          chapterNumber: ch.chapterNumber,
          wordCount: ch.wordCount,
          authorNotesBefore: ch.authorNotesBefore,
          authorNotesAfter: ch.authorNotesAfter,
          publishedAt: ch.publishedAt?.toISOString() || null,
        })),
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString(),
        publishedAt: story.publishedAt?.toISOString() || null,
      },
    };
  }

  async importStory(userId: string, data: ImportedStory) {
    if (!data.title || !data.chapters || data.chapters.length === 0) {
      throw new BadRequestException('Invalid import data: title and at least one chapter required');
    }

    // Validate rating
    const validRatings = ['GENERAL', 'TEEN', 'MATURE', 'EXPLICIT'];
    const rating = data.rating && validRatings.includes(data.rating.toUpperCase())
      ? data.rating.toUpperCase()
      : 'GENERAL';

    // Calculate total word count
    const totalWordCount = data.chapters.reduce((acc, ch) => {
      return acc + this.countWords(ch.content);
    }, 0);

    // Create the story
    const story = await this.prisma.story.create({
      data: {
        title: data.title,
        description: data.description || '',
        authorId: userId,
        status: 'DRAFT',
        rating: rating as any,
        wordCount: totalWordCount,
        chapterCount: data.chapters.length,
      },
    });

    // Create chapters
    for (let i = 0; i < data.chapters.length; i++) {
      const chapter = data.chapters[i];
      await this.prisma.chapter.create({
        data: {
          storyId: story.id,
          title: chapter.title || `Chapter ${i + 1}`,
          content: chapter.content,
          chapterNumber: i + 1,
          wordCount: this.countWords(chapter.content),
          authorNotesBefore: chapter.authorNotesBefore,
          authorNotesAfter: chapter.authorNotesAfter,
          isPublished: false,
        },
      });
    }

    // Handle tags if provided
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags.slice(0, 20)) { // Limit to 20 tags
        // Find or create tag
        let tag = await this.prisma.tag.findFirst({
          where: {
            OR: [
              { canonicalName: { equals: tagName, mode: 'insensitive' } },
              { synonyms: { some: { synonymName: { equals: tagName, mode: 'insensitive' } } } },
            ],
          },
        });

        if (!tag) {
          tag = await this.prisma.tag.create({
            data: {
              canonicalName: tagName.toLowerCase(),
              type: 'ADDITIONAL',
            },
          });
        }

        // Link tag to story
        await this.prisma.storyTag.create({
          data: {
            storyId: story.id,
            tagId: tag.id,
            addedByAuthor: true,
          },
        }).catch(() => {}); // Ignore if already exists
      }
    }

    return {
      success: true,
      storyId: story.id,
      chaptersImported: data.chapters.length,
    };
  }

  async importFromJson(userId: string, jsonString: string) {
    try {
      const data = JSON.parse(jsonString);

      // Check if it's our export format
      if (data.version && data.story) {
        return this.importStory(userId, {
          title: data.story.title,
          description: data.story.description,
          chapters: data.story.chapters.map((ch: any) => ({
            title: ch.title,
            content: ch.content,
            authorNotesBefore: ch.authorNotesBefore,
            authorNotesAfter: ch.authorNotesAfter,
          })),
          tags: data.story.tags,
          rating: data.story.rating,
        });
      }

      // Try to parse as a simple format
      return this.importStory(userId, data);
    } catch (error) {
      throw new BadRequestException('Invalid JSON format');
    }
  }

  async importFromText(userId: string, title: string, content: string) {
    // Split content into chapters by common patterns
    const chapterPatterns = [
      /^#{1,3}\s*chapter\s+\d+/gim,
      /^chapter\s+\d+/gim,
      /^#{1,3}\s+.+$/gm,
    ];

    let chapters: ImportedChapter[] = [];
    let splitContent = content;

    // Try different chapter patterns
    for (const pattern of chapterPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 1) {
        const parts = content.split(pattern);
        chapters = matches.map((header, i) => ({
          title: header.replace(/^#+\s*/, '').trim(),
          content: (parts[i + 1] || '').trim(),
        })).filter(ch => ch.content.length > 0);
        break;
      }
    }

    // If no chapters found, treat entire content as one chapter
    if (chapters.length === 0) {
      chapters = [{
        title: 'Chapter 1',
        content: content.trim(),
      }];
    }

    return this.importStory(userId, {
      title,
      description: '',
      chapters,
    });
  }

  private countWords(text: string): number {
    const plainText = text.replace(/<[^>]*>/g, ' ');
    const words = plainText.split(/\s+/).filter((word) => word.length > 0);
    return words.length;
  }
}
