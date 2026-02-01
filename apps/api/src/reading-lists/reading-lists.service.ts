import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateReadingListDto, UpdateReadingListDto, AddStoryToListDto } from './dto';

@Injectable()
export class ReadingListsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReadingListDto) {
    return this.prisma.readingList.create({
      data: {
        ...dto,
        userId,
      },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.readingList.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async findPublicByUser(userId: string) {
    return this.prisma.readingList.findMany({
      where: { userId, isPublic: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async findOne(listId: string, requestingUserId?: string) {
    const list = await this.prisma.readingList.findUnique({
      where: { id: listId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            story: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
                tags: {
                  include: { tag: true },
                },
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
    });

    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    // Check if private and not owner
    if (!list.isPublic && list.userId !== requestingUserId) {
      throw new NotFoundException('Reading list not found');
    }

    return {
      ...list,
      items: list.items.map((item) => ({
        id: item.id,
        order: item.order,
        note: item.note,
        addedAt: item.addedAt,
        story: {
          ...item.story,
          tags: item.story.tags.map((st) => st.tag),
        },
      })),
    };
  }

  async update(listId: string, userId: string, dto: UpdateReadingListDto) {
    const list = await this.prisma.readingList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reading lists');
    }

    return this.prisma.readingList.update({
      where: { id: listId },
      data: dto,
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async delete(listId: string, userId: string) {
    const list = await this.prisma.readingList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reading lists');
    }

    await this.prisma.readingList.delete({
      where: { id: listId },
    });

    return { success: true };
  }

  async addStory(listId: string, userId: string, dto: AddStoryToListDto) {
    const list = await this.prisma.readingList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own reading lists');
    }

    const story = await this.prisma.story.findUnique({
      where: { id: dto.storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const existing = await this.prisma.readingListItem.findUnique({
      where: {
        readingListId_storyId: {
          readingListId: listId,
          storyId: dto.storyId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Story is already in this list');
    }

    // Get the next order number
    const lastItem = await this.prisma.readingListItem.findFirst({
      where: { readingListId: listId },
      orderBy: { order: 'desc' },
    });

    const item = await this.prisma.readingListItem.create({
      data: {
        readingListId: listId,
        storyId: dto.storyId,
        note: dto.note,
        order: (lastItem?.order ?? -1) + 1,
      },
      include: {
        story: {
          include: {
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

    // Update the list's updatedAt
    await this.prisma.readingList.update({
      where: { id: listId },
      data: { updatedAt: new Date() },
    });

    return item;
  }

  async removeStory(listId: string, userId: string, storyId: string) {
    const list = await this.prisma.readingList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own reading lists');
    }

    const item = await this.prisma.readingListItem.findUnique({
      where: {
        readingListId_storyId: {
          readingListId: listId,
          storyId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Story not in this list');
    }

    await this.prisma.readingListItem.delete({
      where: { id: item.id },
    });

    return { success: true };
  }

  async reorderStories(listId: string, userId: string, storyIds: string[]) {
    const list = await this.prisma.readingList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own reading lists');
    }

    // Update each item's order
    await Promise.all(
      storyIds.map((storyId, index) =>
        this.prisma.readingListItem.updateMany({
          where: { readingListId: listId, storyId },
          data: { order: index },
        }),
      ),
    );

    return this.findOne(listId, userId);
  }

  async updateItemNote(
    listId: string,
    userId: string,
    storyId: string,
    note: string | null,
  ) {
    const list = await this.prisma.readingList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own reading lists');
    }

    const item = await this.prisma.readingListItem.findUnique({
      where: {
        readingListId_storyId: {
          readingListId: listId,
          storyId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Story not in this list');
    }

    return this.prisma.readingListItem.update({
      where: { id: item.id },
      data: { note },
    });
  }
}
