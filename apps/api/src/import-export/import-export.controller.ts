import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ImportExportService } from './import-export.service';
import { JwtAuthGuard, CurrentUser } from '../auth';

class ImportJsonDto {
  json: string;
}

class ImportTextDto {
  title: string;
  content: string;
}

class ImportStoryDto {
  title: string;
  description?: string;
  chapters: {
    title: string;
    content: string;
    authorNotesBefore?: string;
    authorNotesAfter?: string;
  }[];
  tags?: string[];
  rating?: string;
}

@Controller('import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @UseGuards(JwtAuthGuard)
  @Get('stories/:storyId')
  @Header('Content-Type', 'application/json')
  async exportStory(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const data = await this.importExportService.exportStory(storyId, userId);

    res.set({
      'Content-Disposition': `attachment; filename="story-${storyId}.json"`,
    });

    res.send(JSON.stringify(data, null, 2));
  }

  @UseGuards(JwtAuthGuard)
  @Post('import/json')
  async importFromJson(
    @CurrentUser('id') userId: string,
    @Body() dto: ImportJsonDto,
  ) {
    return this.importExportService.importFromJson(userId, dto.json);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import/text')
  async importFromText(
    @CurrentUser('id') userId: string,
    @Body() dto: ImportTextDto,
  ) {
    return this.importExportService.importFromText(userId, dto.title, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import/story')
  async importStory(
    @CurrentUser('id') userId: string,
    @Body() dto: ImportStoryDto,
  ) {
    return this.importExportService.importStory(userId, dto);
  }
}
