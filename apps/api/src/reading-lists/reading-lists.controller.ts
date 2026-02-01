import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReadingListsService } from './reading-lists.service';
import { CreateReadingListDto, UpdateReadingListDto, AddStoryToListDto } from './dto';
import { JwtAuthGuard, CurrentUser, Public } from '../auth';

@Controller('reading-lists')
export class ReadingListsController {
  constructor(private readingListsService: ReadingListsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReadingListDto,
  ) {
    return this.readingListsService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMyLists(@CurrentUser('id') userId: string) {
    return this.readingListsService.findAll(userId);
  }

  @Public()
  @Get('user/:userId')
  async findPublicByUser(@Param('userId') userId: string) {
    return this.readingListsService.findPublicByUser(userId);
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id') listId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.readingListsService.findOne(listId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') listId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReadingListDto,
  ) {
    return this.readingListsService.update(listId, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Param('id') listId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.readingListsService.delete(listId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/stories')
  async addStory(
    @Param('id') listId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddStoryToListDto,
  ) {
    return this.readingListsService.addStory(listId, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/stories/:storyId')
  async removeStory(
    @Param('id') listId: string,
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.readingListsService.removeStory(listId, userId, storyId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/reorder')
  async reorder(
    @Param('id') listId: string,
    @CurrentUser('id') userId: string,
    @Body('storyIds') storyIds: string[],
  ) {
    return this.readingListsService.reorderStories(listId, userId, storyIds);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/stories/:storyId/note')
  async updateNote(
    @Param('id') listId: string,
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
    @Body('note') note: string | null,
  ) {
    return this.readingListsService.updateItemNote(listId, userId, storyId, note);
  }
}
