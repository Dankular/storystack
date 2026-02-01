import { Module } from '@nestjs/common';
import { ReadingHistoryController } from './reading-history.controller';
import { ReadingHistoryService } from './reading-history.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [ReadingHistoryController],
  providers: [ReadingHistoryService],
  exports: [ReadingHistoryService],
})
export class ReadingHistoryModule {}
