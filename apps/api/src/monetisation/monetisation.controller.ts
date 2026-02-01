import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MonetisationService } from './monetisation.service';
import { CreateTipDto, ConfirmTipDto, UpdateAuthorProfileDto } from './dto';
import { JwtAuthGuard, CurrentUser, Public } from '../auth';

@Controller('monetisation')
export class MonetisationController {
  constructor(private monetisationService: MonetisationService) {}

  // Author Profile
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.monetisationService.getAuthorProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAuthorProfileDto,
  ) {
    return this.monetisationService.updateAuthorProfile(userId, dto);
  }

  // Stripe Connect
  @UseGuards(JwtAuthGuard)
  @Post('connect')
  async createConnectLink(
    @CurrentUser('id') userId: string,
    @Body('returnUrl') returnUrl: string,
  ) {
    return this.monetisationService.createConnectAccountLink(userId, returnUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('connect/status')
  async getConnectStatus(@CurrentUser('id') userId: string) {
    return this.monetisationService.checkOnboardingStatus(userId);
  }

  // Public: Check if author accepts tips
  @Public()
  @Get('author/:userId/tips-enabled')
  async canReceiveTips(@Param('userId') userId: string) {
    return this.monetisationService.canReceiveTips(userId);
  }

  // Tipping
  @UseGuards(JwtAuthGuard)
  @Post('tips')
  async createTip(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTipDto,
  ) {
    return this.monetisationService.createTipPaymentIntent(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tips/confirm')
  async confirmTip(@Body() dto: ConfirmTipDto) {
    return this.monetisationService.confirmTip(dto.paymentIntentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tips/received')
  async getTipsReceived(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.monetisationService.getTipsReceived(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('tips/sent')
  async getTipsSent(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.monetisationService.getTipsSent(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('tips/stats')
  async getTipStats(@CurrentUser('id') userId: string) {
    return this.monetisationService.getTipStats(userId);
  }
}
