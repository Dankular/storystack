import { Module } from '@nestjs/common';
import { MonetisationController } from './monetisation.controller';
import { MonetisationService } from './monetisation.service';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [NotificationsModule],
  controllers: [MonetisationController],
  providers: [MonetisationService],
  exports: [MonetisationService],
})
export class MonetisationModule {}
