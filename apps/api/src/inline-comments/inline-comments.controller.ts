import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { InlineCommentsService } from './inline-comments.service';
import { JwtAuthGuard, CurrentUser, Public } from '../auth';

class CreateInlineCommentDto {
  paragraphIndex: number;
  content: string;
  textSelection?: string;
  parentId?: string;
}

class UpdateInlineCommentDto {
  content: string;
}

class ResolveCommentDto {
  resolved: boolean;
}

@Controller('inline-comments')
export class InlineCommentsController {
  constructor(private readonly inlineCommentsService: InlineCommentsService) {}

  // Get all inline comments for a chapter
  @Public()
  @Get('chapters/:chapterId')
  async getChapterComments(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.inlineCommentsService.getChapterComments(chapterId, userId);
  }

  // Get a specific comment thread
  @Public()
  @Get(':commentId')
  async getCommentThread(@Param('commentId') commentId: string) {
    return this.inlineCommentsService.getCommentThread(commentId);
  }

  // Create a new inline comment
  @UseGuards(JwtAuthGuard)
  @Post('chapters/:chapterId')
  async createComment(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInlineCommentDto,
  ) {
    return this.inlineCommentsService.createComment(
      userId,
      chapterId,
      dto.paragraphIndex,
      dto.content,
      dto.textSelection,
      dto.parentId,
    );
  }

  // Update a comment
  @UseGuards(JwtAuthGuard)
  @Put(':commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateInlineCommentDto,
  ) {
    return this.inlineCommentsService.updateComment(commentId, userId, dto.content);
  }

  // Delete a comment
  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.inlineCommentsService.deleteComment(commentId, userId);
  }

  // Resolve/unresolve a comment (for authors)
  @UseGuards(JwtAuthGuard)
  @Put(':commentId/resolve')
  async resolveComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ResolveCommentDto,
  ) {
    return this.inlineCommentsService.resolveComment(
      commentId,
      userId,
      dto.resolved,
    );
  }
}
