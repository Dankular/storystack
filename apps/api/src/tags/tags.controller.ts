import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto';
import { AddSynonymDto } from './dto/add-synonym.dto';
import { JwtAuthGuard, Public } from '../auth';

type TagType = 'GENRE' | 'THEME' | 'CHARACTER' | 'RELATIONSHIP' | 'WARNING' | 'ADDITIONAL';

@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Public()
  @Get()
  async findAll(
    @Query('type') type?: TagType,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tagsService.findAll({
      type,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Public()
  @Get('popular')
  async findPopular(@Query('limit') limit?: string) {
    return this.tagsService.findPopular(limit ? parseInt(limit, 10) : undefined);
  }

  @Public()
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.tagsService.search(query, limit ? parseInt(limit, 10) : undefined);
  }

  @Public()
  @Get('resolve')
  async resolve(@Query('name') name: string) {
    return this.tagsService.resolveTagName(name);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tagsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/synonyms')
  async addSynonym(
    @Param('id') id: string,
    @Body() dto: AddSynonymDto,
  ) {
    return this.tagsService.addSynonym(id, dto.synonymName);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/synonyms/:synonymId')
  async removeSynonym(
    @Param('id') id: string,
    @Param('synonymId') synonymId: string,
  ) {
    return this.tagsService.removeSynonym(id, synonymId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/merge/:targetId')
  async mergeTags(
    @Param('id') sourceId: string,
    @Param('targetId') targetId: string,
  ) {
    return this.tagsService.mergeTags(sourceId, targetId);
  }
}
