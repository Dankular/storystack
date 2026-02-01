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
import { ChaptersService } from './chapters.service';
import { CreateChapterDto, UpdateChapterDto } from './dto';
import { JwtAuthGuard, CurrentUser, Public } from '../auth';

@Controller('stories/:storyId/chapters')
export class ChaptersController {
  constructor(private chaptersService: ChaptersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChapterDto,
  ) {
    return this.chaptersService.create(storyId, userId, dto);
  }

  @Public()
  @Get()
  async findAll(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.chaptersService.findAllByStory(storyId, userId);
  }

  @Public()
  @Get(':chapterId')
  async findOne(
    @Param('storyId') storyId: string,
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.chaptersService.findOne(storyId, chapterId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':chapterId')
  async update(
    @Param('storyId') storyId: string,
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateChapterDto,
  ) {
    return this.chaptersService.update(storyId, chapterId, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':chapterId')
  async delete(
    @Param('storyId') storyId: string,
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chaptersService.delete(storyId, chapterId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('reorder')
  async reorder(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
    @Body('chapterIds') chapterIds: string[],
  ) {
    return this.chaptersService.reorder(storyId, userId, chapterIds);
  }
}
