import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateTagDto } from './dto';
import { TagType } from '@prisma/client';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: { synonyms: true },
    });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }

  async resolveTagName(name: string) {
    const normalized = name.toLowerCase().trim();

    // First try to find canonical tag
    const canonicalTag = await this.prisma.tag.findUnique({
      where: { canonicalName: normalized },
      include: { synonyms: true },
    });

    if (canonicalTag) {
      return canonicalTag;
    }

    // Try to find by synonym
    const synonym = await this.prisma.tagSynonym.findUnique({
      where: { synonymName: normalized },
      include: {
        tag: {
          include: { synonyms: true },
        },
      },
    });

    if (synonym) {
      return synonym.tag;
    }

    return null;
  }

  async addSynonym(tagId: string, synonymName: string) {
    const tag = await this.findById(tagId);
    const normalized = synonymName.toLowerCase().trim();

    // Check if synonym already exists
    const existingSynonym = await this.prisma.tagSynonym.findUnique({
      where: { synonymName: normalized },
    });

    if (existingSynonym) {
      throw new ConflictException('This synonym already exists');
    }

    // Check if it conflicts with a canonical tag name
    const existingTag = await this.prisma.tag.findUnique({
      where: { canonicalName: normalized },
    });

    if (existingTag) {
      throw new ConflictException('This name is already a canonical tag');
    }

    await this.prisma.tagSynonym.create({
      data: {
        tagId,
        synonymName: normalized,
      },
    });

    return this.findById(tagId);
  }

  async removeSynonym(tagId: string, synonymId: string) {
    const synonym = await this.prisma.tagSynonym.findFirst({
      where: { id: synonymId, tagId },
    });

    if (!synonym) {
      throw new NotFoundException('Synonym not found');
    }

    await this.prisma.tagSynonym.delete({
      where: { id: synonymId },
    });

    return this.findById(tagId);
  }

  async mergeTags(sourceTagId: string, targetTagId: string) {
    // Move all stories from source tag to target tag
    const sourceStoryTags = await this.prisma.storyTag.findMany({
      where: { tagId: sourceTagId },
    });

    for (const storyTag of sourceStoryTags) {
      // Check if story already has target tag
      const existing = await this.prisma.storyTag.findUnique({
        where: {
          storyId_tagId: {
            storyId: storyTag.storyId,
            tagId: targetTagId,
          },
        },
      });

      if (!existing) {
        await this.prisma.storyTag.update({
          where: { id: storyTag.id },
          data: { tagId: targetTagId },
        });
      } else {
        await this.prisma.storyTag.delete({
          where: { id: storyTag.id },
        });
      }
    }

    // Move synonyms to target tag
    await this.prisma.tagSynonym.updateMany({
      where: { tagId: sourceTagId },
      data: { tagId: targetTagId },
    });

    // Add old canonical name as synonym
    const sourceTag = await this.prisma.tag.findUnique({
      where: { id: sourceTagId },
    });

    if (sourceTag) {
      await this.prisma.tagSynonym.create({
        data: {
          tagId: targetTagId,
          synonymName: sourceTag.canonicalName,
        },
      });
    }

    // Delete source tag
    await this.prisma.tag.delete({
      where: { id: sourceTagId },
    });

    // Update usage count
    const targetTag = await this.prisma.tag.findUnique({
      where: { id: targetTagId },
      include: { storyTags: true },
    });

    if (targetTag) {
      await this.prisma.tag.update({
        where: { id: targetTagId },
        data: { usageCount: targetTag.storyTags.length },
      });
    }

    return this.findById(targetTagId);
  }

  async create(dto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { canonicalName: dto.canonicalName.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Tag already exists');
    }

    return this.prisma.tag.create({
      data: {
        ...dto,
        canonicalName: dto.canonicalName.toLowerCase(),
      },
    });
  }

  async findAll(options?: { type?: TagType; search?: string; limit?: number }) {
    const limit = options?.limit || 50;

    return this.prisma.tag.findMany({
      where: {
        ...(options?.type && { type: options.type }),
        ...(options?.search && {
          canonicalName: { contains: options.search.toLowerCase() },
        }),
      },
      orderBy: { usageCount: 'desc' },
      take: limit,
      include: {
        synonyms: true,
      },
    });
  }

  async findPopular(limit = 20) {
    return this.prisma.tag.findMany({
      orderBy: { usageCount: 'desc' },
      take: limit,
    });
  }

  async search(query: string, limit = 10) {
    // Search both canonical names and synonyms
    const tags = await this.prisma.tag.findMany({
      where: {
        OR: [
          { canonicalName: { contains: query.toLowerCase() } },
          { synonyms: { some: { synonymName: { contains: query.toLowerCase() } } } },
        ],
      },
      take: limit,
      include: {
        synonyms: true,
      },
    });

    return tags;
  }

  async incrementUsage(tagId: string) {
    await this.prisma.tag.update({
      where: { id: tagId },
      data: { usageCount: { increment: 1 } },
    });
  }

  async decrementUsage(tagId: string) {
    await this.prisma.tag.update({
      where: { id: tagId },
      data: { usageCount: { decrement: 1 } },
    });
  }
}
