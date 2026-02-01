import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { JwtAuthGuard, CurrentUser } from '../auth';

@Controller('me/scheduled-chapters')
export class ScheduledChaptersController {
  constructor(private chaptersService: ChaptersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getScheduledChapters(@CurrentUser('id') userId: string) {
    return this.chaptersService.getScheduledChapters(userId);
  }
}
