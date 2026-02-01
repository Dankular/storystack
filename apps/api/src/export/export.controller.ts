import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('stories/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPdf(
    @Param('id') id: string,
    @Query('includeAuthorNotes') includeAuthorNotes: string,
    @Query('includeTableOfContents') includeTableOfContents: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportStoryAsPdf(id, {
      includeAuthorNotes: includeAuthorNotes === 'true',
      includeTableOfContents: includeTableOfContents === 'true',
    });

    res.set({
      'Content-Disposition': `attachment; filename="story-${id}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('stories/:id/epub')
  @Header('Content-Type', 'application/epub+zip')
  async exportEpub(
    @Param('id') id: string,
    @Query('includeAuthorNotes') includeAuthorNotes: string,
    @Query('includeTableOfContents') includeTableOfContents: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportStoryAsEpub(id, {
      includeAuthorNotes: includeAuthorNotes === 'true',
      includeTableOfContents: includeTableOfContents === 'true',
    });

    res.set({
      'Content-Disposition': `attachment; filename="story-${id}.epub"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('stories/:id/html')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async exportHtml(
    @Param('id') id: string,
    @Query('includeAuthorNotes') includeAuthorNotes: string,
    @Query('includeTableOfContents') includeTableOfContents: string,
    @Res() res: Response,
  ) {
    const html = await this.exportService.exportStoryAsHtml(id, {
      includeAuthorNotes: includeAuthorNotes === 'true',
      includeTableOfContents: includeTableOfContents === 'true',
    });

    res.set({
      'Content-Disposition': `attachment; filename="story-${id}.html"`,
    });

    res.send(html);
  }
}
