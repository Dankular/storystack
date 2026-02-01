import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class InlineCommentsService {
  constructor(private prisma: PrismaService) {}

  async createComment(
    userId: string,
    chapterId: string,
    paragraphIndex: number,
    content: string,
    textSelection?: string,
    parentId?: string,
  ) {
    // Verify chapter exists and is published (or user is author/collaborator)
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        story: {
          include: {
            collaborators: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    // Check access
    const isAuthor = chapter.story.authorId === userId;
    const isCollaborator = chapter.story.collaborators.some(
      (c) => c.userId === userId,
    );

    if (!chapter.isPublished && !isAuthor && !isCollaborator) {
      throw new NotFoundException('Chapter not found');
    }

    // If replying, verify parent exists
    if (parentId) {
      const parent = await this.prisma.inlineComment.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.chapterId !== chapterId) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    const comment = await this.prisma.inlineComment.create({
      data: {
        authorId: userId,
        chapterId,
        paragraphIndex,
        content,
        textSelection,
        parentId,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Notify story author if commenter is not the author
    if (!isAuthor) {
      await this.prisma.notification.create({
        data: {
          userId: chapter.story.authorId,
          type: 'COMMENT_ON_STORY',
          message: `New inline comment on "${chapter.title}"`,
          data: { chapterId, commentId: comment.id, paragraphIndex },
        },
      });
    }

    return comment;
  }

  async getChapterComments(chapterId: string, userId?: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        story: {
          include: {
            collaborators: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    // Check access
    const isAuthor = userId && chapter.story.authorId === userId;
    const isCollaborator = userId && chapter.story.collaborators.some(
      (c) => c.userId === userId,
    );

    if (!chapter.isPublished && !isAuthor && !isCollaborator) {
      throw new NotFoundException('Chapter not found');
    }

    // Get all top-level comments (not replies)
    const comments = await this.prisma.inlineComment.findMany({
      where: {
        chapterId,
        parentId: null,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ paragraphIndex: 'asc' }, { createdAt: 'asc' }],
    });

    // Group by paragraph index
    const commentsByParagraph: Record<number, typeof comments> = {};
    for (const comment of comments) {
      if (!commentsByParagraph[comment.paragraphIndex]) {
        commentsByParagraph[comment.paragraphIndex] = [];
      }
      commentsByParagraph[comment.paragraphIndex].push(comment);
    }

    return {
      comments,
      byParagraph: commentsByParagraph,
      totalCount: comments.length,
    };
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.inlineComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.inlineComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.inlineComment.findUnique({
      where: { id: commentId },
      include: {
        chapter: {
          include: { story: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Allow author of comment or story author to delete
    const isCommentAuthor = comment.authorId === userId;
    const isStoryAuthor = comment.chapter.story.authorId === userId;

    if (!isCommentAuthor && !isStoryAuthor) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.prisma.inlineComment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }

  async resolveComment(commentId: string, userId: string, resolved: boolean) {
    const comment = await this.prisma.inlineComment.findUnique({
      where: { id: commentId },
      include: {
        chapter: {
          include: {
            story: {
              include: { collaborators: true },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only story author or collaborators with edit access can resolve
    const isStoryAuthor = comment.chapter.story.authorId === userId;
    const isCollaborator = comment.chapter.story.collaborators.some(
      (c) => c.userId === userId && (c.role === 'CO_AUTHOR' || c.role === 'EDITOR'),
    );

    if (!isStoryAuthor && !isCollaborator) {
      throw new ForbiddenException('Only the story author or editors can resolve comments');
    }

    return this.prisma.inlineComment.update({
      where: { id: commentId },
      data: { isResolved: resolved },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async getCommentThread(commentId: string) {
    const comment = await this.prisma.inlineComment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
