import { Module } from '@nestjs/common';
import { InlineCommentsController } from './inline-comments.controller';
import { InlineCommentsService } from './inline-comments.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [InlineCommentsController],
  providers: [InlineCommentsService],
  exports: [InlineCommentsService],
})
export class InlineCommentsModule {}
