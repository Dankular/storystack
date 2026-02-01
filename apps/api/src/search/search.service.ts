import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';
import { PrismaService } from '../prisma';

interface StoryDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  status: string;
  rating: string;
  wordCount: number;
  chapterCount: number;
  viewCount: number;
  likeCount: number;
  reviewCount: number;
  avgRating: number | null;
  tags: string[];
  tagIds: string[];
  publishedAt: number | null;
  updatedAt: number;
}

interface UserDocument {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  storyCount: number;
  followerCount: number;
}

interface TagDocument {
  id: string;
  canonicalName: string;
  type: string;
  synonyms: string[];
  usageCount: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch | null = null;
  private storiesIndex: Index | null = null;
  private usersIndex: Index | null = null;
  private tagsIndex: Index | null = null;
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const host = this.configService.get<string>('MEILISEARCH_HOST');
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY');

    if (!host) {
      this.logger.warn('MEILISEARCH_HOST not configured, search disabled');
      return;
    }

    try {
      this.client = new MeiliSearch({ host, apiKey });

      this.storiesIndex = this.client.index('stories');
      this.usersIndex = this.client.index('users');
      this.tagsIndex = this.client.index('tags');

      await this.configureIndexes();

      this.logger.log('Meilisearch connected and configured');
    } catch (error) {
      this.logger.error('Failed to connect to Meilisearch', error);
    }
  }

  private async configureIndexes() {
    if (!this.storiesIndex || !this.usersIndex || !this.tagsIndex) return;

    await this.storiesIndex.updateSettings({
      searchableAttributes: [
        'title',
        'description',
        'content',
        'authorName',
        'authorUsername',
        'tags',
      ],
      filterableAttributes: [
        'status',
        'rating',
        'wordCount',
        'chapterCount',
        'avgRating',
        'tagIds',
        'authorId',
        'publishedAt',
      ],
      sortableAttributes: [
        'publishedAt',
        'updatedAt',
        'viewCount',
        'likeCount',
        'avgRating',
        'wordCount',
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'viewCount:desc',
      ],
    });

    await this.usersIndex.updateSettings({
      searchableAttributes: ['username', 'displayName', 'bio'],
      filterableAttributes: ['storyCount', 'followerCount'],
      sortableAttributes: ['storyCount', 'followerCount'],
    });

    await this.tagsIndex.updateSettings({
      searchableAttributes: ['canonicalName', 'synonyms'],
      filterableAttributes: ['type', 'usageCount'],
      sortableAttributes: ['usageCount'],
    });
  }

  async indexStory(storyId: string) {
    if (!this.storiesIndex) return;

    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        tags: { include: { tag: true } },
        chapters: {
          where: { isPublished: true },
          select: { content: true },
        },
      },
    });

    if (!story || story.status === 'DRAFT') return;

    const content = story.chapters.map((c) => c.content).join(' ');

    const doc: StoryDocument = {
      id: story.id,
      title: story.title,
      description: story.description,
      content: content.substring(0, 50000),
      authorId: story.authorId,
      authorName: story.author.displayName || story.author.username,
      authorUsername: story.author.username,
      status: story.status,
      rating: story.rating,
      wordCount: story.wordCount,
      chapterCount: story.chapterCount,
      viewCount: story.viewCount,
      likeCount: story.likeCount,
      reviewCount: story.reviewCount,
      avgRating: story.avgRating,
      tags: story.tags.map((t) => t.tag.canonicalName),
      tagIds: story.tags.map((t) => t.tagId),
      publishedAt: story.publishedAt?.getTime() || null,
      updatedAt: story.updatedAt.getTime(),
    };

    await this.storiesIndex.addDocuments([doc]);
  }

  async removeStory(storyId: string) {
    if (!this.storiesIndex) return;
    await this.storiesIndex.deleteDocument(storyId);
  }

  async indexUser(userId: string) {
    if (!this.usersIndex) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { stories: true, followers: true },
        },
      },
    });

    if (!user) return;

    const doc: UserDocument = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      storyCount: user._count.stories,
      followerCount: user._count.followers,
    };

    await this.usersIndex.addDocuments([doc]);
  }

  async indexTag(tagId: string) {
    if (!this.tagsIndex) return;

    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
      include: { synonyms: true },
    });

    if (!tag) return;

    const doc: TagDocument = {
      id: tag.id,
      canonicalName: tag.canonicalName,
      type: tag.type,
      synonyms: tag.synonyms.map((s) => s.synonymName),
      usageCount: tag.usageCount,
    };

    await this.tagsIndex.addDocuments([doc]);
  }

  async reindexAll() {
    if (!this.client) {
      throw new Error('Meilisearch not configured');
    }

    this.logger.log('Starting full reindex...');

    const stories = await this.prisma.story.findMany({
      where: { status: { not: 'DRAFT' } },
      select: { id: true },
    });

    for (const story of stories) {
      await this.indexStory(story.id);
    }
    this.logger.log(`Indexed ${stories.length} stories`);

    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await this.indexUser(user.id);
    }
    this.logger.log(`Indexed ${users.length} users`);

    const tags = await this.prisma.tag.findMany({
      select: { id: true },
    });

    for (const tag of tags) {
      await this.indexTag(tag.id);
    }
    this.logger.log(`Indexed ${tags.length} tags`);

    this.logger.log('Full reindex complete');
  }

  async searchStories(
    query: string,
    options?: {
      page?: number;
      limit?: number;
      filters?: {
        status?: string;
        rating?: string;
        minWordCount?: number;
        maxWordCount?: number;
        minRating?: number;
        tagIds?: string[];
        excludeTagIds?: string[];
        authorId?: string;
      };
      sort?: string;
    },
  ) {
    if (!this.storiesIndex) {
      return this.fallbackStorySearch(query, options);
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);

    const filterParts: string[] = [];

    if (options?.filters?.status) {
      filterParts.push(`status = "${options.filters.status}"`);
    }
    if (options?.filters?.rating) {
      filterParts.push(`rating = "${options.filters.rating}"`);
    }
    if (options?.filters?.minWordCount) {
      filterParts.push(`wordCount >= ${options.filters.minWordCount}`);
    }
    if (options?.filters?.maxWordCount) {
      filterParts.push(`wordCount <= ${options.filters.maxWordCount}`);
    }
    if (options?.filters?.minRating) {
      filterParts.push(`avgRating >= ${options.filters.minRating}`);
    }
    if (options?.filters?.authorId) {
      filterParts.push(`authorId = "${options.filters.authorId}"`);
    }
    if (options?.filters?.tagIds?.length) {
      const tagFilter = options.filters.tagIds.map((t) => `tagIds = "${t}"`).join(' OR ');
      filterParts.push(`(${tagFilter})`);
    }
    if (options?.filters?.excludeTagIds?.length) {
      for (const tagId of options.filters.excludeTagIds) {
        filterParts.push(`tagIds != "${tagId}"`);
      }
    }

    let sort: string[] | undefined;
    switch (options?.sort) {
      case 'newest':
        sort = ['publishedAt:desc'];
        break;
      case 'popular':
        sort = ['likeCount:desc'];
        break;
      case 'views':
        sort = ['viewCount:desc'];
        break;
      case 'rating':
        sort = ['avgRating:desc'];
        break;
      case 'updated':
        sort = ['updatedAt:desc'];
        break;
    }

    const results = await this.storiesIndex.search(query, {
      offset: (page - 1) * limit,
      limit,
      filter: filterParts.length > 0 ? filterParts.join(' AND ') : undefined,
      sort,
      attributesToRetrieve: ['id'],
    });

    const storyIds = results.hits.map((h) => h.id as string);

    const stories = await this.prisma.story.findMany({
      where: { id: { in: storyIds } },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        tags: { include: { tag: true } },
      },
    });

    const storyMap = new Map(stories.map((s) => [s.id, s]));
    const orderedStories = storyIds
      .map((id) => storyMap.get(id))
      .filter(Boolean)
      .map((story: any) => ({
        ...story,
        tags: story.tags.map((t: any) => t.tag),
      }));

    return {
      stories: orderedStories,
      pagination: {
        page,
        limit,
        total: results.estimatedTotalHits,
        totalPages: Math.ceil(results.estimatedTotalHits / limit),
      },
      processingTimeMs: results.processingTimeMs,
    };
  }

  async searchUsers(query: string, options?: { page?: number; limit?: number }) {
    if (!this.usersIndex) {
      return { users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);

    const results = await this.usersIndex.search(query, {
      offset: (page - 1) * limit,
      limit,
    });

    const userIds = results.hits.map((h) => h.id as string);

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        _count: { select: { stories: true, followers: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const orderedUsers = userIds.map((id) => userMap.get(id)).filter(Boolean);

    return {
      users: orderedUsers,
      pagination: {
        page,
        limit,
        total: results.estimatedTotalHits,
        totalPages: Math.ceil(results.estimatedTotalHits / limit),
      },
    };
  }

  async searchTags(query: string, options?: { page?: number; limit?: number; type?: string }) {
    if (!this.tagsIndex) {
      return { tags: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);

    const filter = options?.type ? `type = "${options.type}"` : undefined;

    const results = await this.tagsIndex.search(query, {
      offset: (page - 1) * limit,
      limit,
      filter,
      sort: ['usageCount:desc'],
    });

    const tagIds = results.hits.map((h) => h.id as string);

    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
      include: { synonyms: true },
    });

    const tagMap = new Map(tags.map((t) => [t.id, t]));
    const orderedTags = tagIds.map((id) => tagMap.get(id)).filter(Boolean);

    return {
      tags: orderedTags,
      pagination: {
        page,
        limit,
        total: results.estimatedTotalHits,
        totalPages: Math.ceil(results.estimatedTotalHits / limit),
      },
    };
  }

  async searchAll(query: string) {
    const [stories, users, tags] = await Promise.all([
      this.searchStories(query, { limit: 5 }),
      this.searchUsers(query, { limit: 5 }),
      this.searchTags(query, { limit: 10 }),
    ]);

    return { stories, users, tags };
  }

  private async fallbackStorySearch(
    query: string,
    options?: {
      page?: number;
      limit?: number;
      filters?: any;
      sort?: string;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: any = {
      status: { not: 'DRAFT' },
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (options?.filters?.status) where.status = options.filters.status;
    if (options?.filters?.rating) where.rating = options.filters.rating;
    if (options?.filters?.minWordCount) where.wordCount = { gte: options.filters.minWordCount };
    if (options?.filters?.maxWordCount) where.wordCount = { ...where.wordCount, lte: options.filters.maxWordCount };

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.story.count({ where }),
    ]);

    return {
      stories: stories.map((s) => ({
        ...s,
        tags: s.tags.map((t) => t.tag),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Saved searches
  async createSavedSearch(userId: string, data: {
    name: string;
    query: string;
    filters?: any;
    notifyNewResults?: boolean;
  }) {
    return this.prisma.savedSearch.create({
      data: {
        userId,
        name: data.name,
        query: data.query,
        filters: data.filters,
        notifyNewResults: data.notifyNewResults ?? false,
      },
    });
  }

  async getSavedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSavedSearch(userId: string, searchId: string, data: {
    name?: string;
    notifyNewResults?: boolean;
  }) {
    return this.prisma.savedSearch.updateMany({
      where: { id: searchId, userId },
      data,
    });
  }

  async deleteSavedSearch(userId: string, searchId: string) {
    return this.prisma.savedSearch.deleteMany({
      where: { id: searchId, userId },
    });
  }

  isEnabled() {
    return this.client !== null;
  }
}
