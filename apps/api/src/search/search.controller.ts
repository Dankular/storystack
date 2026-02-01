import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SearchStoriesDto,
  SearchUsersDto,
  SearchTagsDto,
  CreateSavedSearchDto,
  UpdateSavedSearchDto,
} from './dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('status')
  getStatus() {
    return {
      enabled: this.searchService.isEnabled(),
    };
  }

  @Get('stories')
  async searchStories(@Query() query: SearchStoriesDto) {
    return this.searchService.searchStories(query.query, {
      page: query.page,
      limit: query.limit,
      filters: {
        status: query.status,
        rating: query.rating,
        minWordCount: query.minWordCount,
        maxWordCount: query.maxWordCount,
        minRating: query.minRating,
        tagIds: query.tagIds,
        excludeTagIds: query.excludeTagIds,
      },
      sort: query.sort,
    });
  }

  @Get('users')
  async searchUsers(@Query() query: SearchUsersDto) {
    return this.searchService.searchUsers(query.query, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('tags')
  async searchTags(@Query() query: SearchTagsDto) {
    return this.searchService.searchTags(query.query, {
      page: query.page,
      limit: query.limit,
      type: query.type,
    });
  }

  @Get('all')
  async searchAll(@Query('q') query: string) {
    if (!query) {
      return {
        stories: { stories: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } },
        users: { users: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } },
        tags: { tags: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
      };
    }
    return this.searchService.searchAll(query);
  }

  // Saved searches - require authentication
  @UseGuards(JwtAuthGuard)
  @Get('saved')
  async getSavedSearches(@Request() req: any) {
    return this.searchService.getSavedSearches(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('saved')
  async createSavedSearch(@Request() req: any, @Body() dto: CreateSavedSearchDto) {
    const filters = {
      status: dto.status,
      rating: dto.rating,
      minWordCount: dto.minWordCount,
      maxWordCount: dto.maxWordCount,
      minRating: dto.minRating,
      tagIds: dto.tagIds,
      excludeTagIds: dto.excludeTagIds,
      sort: dto.sort,
    };

    return this.searchService.createSavedSearch(req.user.id, {
      name: dto.name,
      query: dto.query,
      filters,
      notifyNewResults: dto.notifyNewResults,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('saved/:id')
  async updateSavedSearch(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
  ) {
    await this.searchService.updateSavedSearch(req.user.id, id, dto);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('saved/:id')
  async deleteSavedSearch(@Request() req: any, @Param('id') id: string) {
    await this.searchService.deleteSavedSearch(req.user.id, id);
    return { success: true };
  }

  // Admin endpoint to trigger reindex
  @UseGuards(JwtAuthGuard)
  @Post('reindex')
  async reindex(@Request() req: any) {
    // In production, add admin role check here
    await this.searchService.reindexAll();
    return { success: true, message: 'Reindex complete' };
  }
}
