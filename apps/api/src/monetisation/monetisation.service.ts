import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma';
import { NotificationsService } from '../notifications';
import { CreateTipDto, UpdateAuthorProfileDto } from './dto';

@Injectable()
export class MonetisationService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey);
    }
  }

  // Author Profile Management
  async getAuthorProfile(userId: string) {
    const profile = await this.prisma.authorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return profile;
  }

  async getOrCreateAuthorProfile(userId: string) {
    let profile = await this.prisma.authorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.authorProfile.create({
        data: { userId },
      });
    }

    return profile;
  }

  async updateAuthorProfile(userId: string, dto: UpdateAuthorProfileDto) {
    const profile = await this.getOrCreateAuthorProfile(userId);

    return this.prisma.authorProfile.update({
      where: { id: profile.id },
      data: {
        tipsEnabled: dto.tipsEnabled,
        minimumTipAmount: dto.minimumTipAmount,
      },
    });
  }

  // Stripe Connect
  async createConnectAccountLink(userId: string, returnUrl: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    let profile = await this.getOrCreateAuthorProfile(userId);

    // Create Stripe Connect account if doesn't exist
    if (!profile.stripeAccountId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const account = await this.stripe.accounts.create({
        type: 'express',
        email: user?.email,
        capabilities: {
          transfers: { requested: true },
        },
      });

      profile = await this.prisma.authorProfile.update({
        where: { id: profile.id },
        data: { stripeAccountId: account.id },
      });
    }

    // Create account link for onboarding
    const accountLink = await this.stripe.accountLinks.create({
      account: profile.stripeAccountId!,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  async checkOnboardingStatus(userId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const profile = await this.prisma.authorProfile.findUnique({
      where: { userId },
    });

    if (!profile?.stripeAccountId) {
      return { onboarded: false, canReceivePayments: false };
    }

    const account = await this.stripe.accounts.retrieve(profile.stripeAccountId);

    const onboarded = account.details_submitted ?? false;
    const canReceivePayments = account.charges_enabled ?? false;

    // Update profile if status changed
    if (profile.stripeOnboarded !== onboarded) {
      await this.prisma.authorProfile.update({
        where: { id: profile.id },
        data: { stripeOnboarded: onboarded },
      });
    }

    return {
      onboarded,
      canReceivePayments,
      payoutsEnabled: account.payouts_enabled,
    };
  }

  // Tipping
  async createTipPaymentIntent(senderId: string, dto: CreateTipDto) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    // Get recipient's author profile
    const recipientProfile = await this.prisma.authorProfile.findFirst({
      where: {
        OR: [
          { id: dto.recipientId },
          { userId: dto.recipientId },
        ],
      },
      include: {
        user: { select: { id: true, displayName: true, username: true } },
      },
    });

    if (!recipientProfile) {
      throw new NotFoundException('Author profile not found');
    }

    if (!recipientProfile.tipsEnabled) {
      throw new BadRequestException('This author does not accept tips');
    }

    if (!recipientProfile.stripeAccountId || !recipientProfile.stripeOnboarded) {
      throw new BadRequestException('Author has not completed payment setup');
    }

    if (dto.amount < recipientProfile.minimumTipAmount) {
      throw new BadRequestException(
        `Minimum tip amount is $${(recipientProfile.minimumTipAmount / 100).toFixed(2)}`,
      );
    }

    // Cannot tip yourself
    if (recipientProfile.userId === senderId) {
      throw new ForbiddenException('You cannot tip yourself');
    }

    // Verify story exists if provided
    if (dto.storyId) {
      const story = await this.prisma.story.findUnique({
        where: { id: dto.storyId },
      });
      if (!story) {
        throw new NotFoundException('Story not found');
      }
      if (story.authorId !== recipientProfile.userId) {
        throw new BadRequestException('Story does not belong to this author');
      }
    }

    // Calculate platform fee (10%)
    const platformFee = Math.round(dto.amount * 0.10);
    const authorAmount = dto.amount - platformFee;

    // Create Stripe Payment Intent with transfer
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: dto.amount,
      currency: 'usd',
      transfer_data: {
        destination: recipientProfile.stripeAccountId,
        amount: authorAmount,
      },
      metadata: {
        senderId,
        recipientId: recipientProfile.id,
        recipientUserId: recipientProfile.userId,
        storyId: dto.storyId || '',
        message: dto.message || '',
      },
    });

    // Create tip record
    const tip = await this.prisma.tip.create({
      data: {
        amount: dto.amount,
        message: dto.message,
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
        senderId,
        recipientId: recipientProfile.id,
        storyId: dto.storyId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      tipId: tip.id,
    };
  }

  async confirmTip(paymentIntentId: string) {
    const tip = await this.prisma.tip.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        sender: { select: { displayName: true, username: true } },
        recipient: {
          include: { user: { select: { id: true } } },
        },
        story: { select: { title: true } },
      },
    });

    if (!tip) {
      throw new NotFoundException('Tip not found');
    }

    // Update tip status
    await this.prisma.tip.update({
      where: { id: tip.id },
      data: { status: 'COMPLETED' },
    });

    // Notify the author
    const senderName = tip.sender.displayName || tip.sender.username;
    let message = `${senderName} sent you a $${(tip.amount / 100).toFixed(2)} tip`;
    if (tip.story) {
      message += ` for "${tip.story.title}"`;
    }

    await this.notificationsService.create(
      tip.recipient.user.id,
      'NEW_TIP',
      message,
      {
        tipId: tip.id,
        senderId: tip.senderId,
        amount: tip.amount,
        storyId: tip.storyId,
      },
    );

    return { success: true };
  }

  async getTipsReceived(userId: string, page = 1, limit = 20) {
    const profile = await this.prisma.authorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return { tips: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const skip = (page - 1) * limit;

    const [tips, total] = await Promise.all([
      this.prisma.tip.findMany({
        where: { recipientId: profile.id, status: 'COMPLETED' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          story: { select: { id: true, title: true } },
        },
      }),
      this.prisma.tip.count({
        where: { recipientId: profile.id, status: 'COMPLETED' },
      }),
    ]);

    return {
      tips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTipsSent(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [tips, total] = await Promise.all([
      this.prisma.tip.findMany({
        where: { senderId: userId, status: 'COMPLETED' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: {
            include: {
              user: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            },
          },
          story: { select: { id: true, title: true } },
        },
      }),
      this.prisma.tip.count({
        where: { senderId: userId, status: 'COMPLETED' },
      }),
    ]);

    return {
      tips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTipStats(userId: string) {
    const profile = await this.prisma.authorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return { totalReceived: 0, tipCount: 0, thisMonth: 0 };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalStats, monthStats] = await Promise.all([
      this.prisma.tip.aggregate({
        where: { recipientId: profile.id, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.tip.aggregate({
        where: {
          recipientId: profile.id,
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalReceived: totalStats._sum.amount || 0,
      tipCount: totalStats._count.id,
      thisMonth: monthStats._sum.amount || 0,
    };
  }

  // Check if an author accepts tips (public endpoint)
  async canReceiveTips(userId: string) {
    const profile = await this.prisma.authorProfile.findUnique({
      where: { userId },
      select: {
        tipsEnabled: true,
        stripeOnboarded: true,
        minimumTipAmount: true,
      },
    });

    if (!profile) {
      return { canReceiveTips: false };
    }

    return {
      canReceiveTips: profile.tipsEnabled && profile.stripeOnboarded,
      minimumTipAmount: profile.minimumTipAmount,
    };
  }
}
