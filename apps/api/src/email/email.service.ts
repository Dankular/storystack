import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly appName = 'StoryStack';
  private readonly appUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@storystack.app';
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      this.logger.warn('RESEND_API_KEY not set - email sending disabled');
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn(`Email not sent (no API key): ${options.subject} to ${options.to}`);
      return false;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: `${this.appName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`);
        return false;
      }

      this.logger.log(`Email sent: ${options.subject} to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Email error: ${error}`);
      return false;
    }
  }

  private wrapHtml(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #6366f1; margin: 0; }
    .content { background: #f9fafb; border-radius: 8px; padding: 24px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
    .footer a { color: #6366f1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 ${this.appName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>You're receiving this email because you have an account on ${this.appName}.</p>
      <p><a href="${this.appUrl}/settings/notifications">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  // New chapter notification
  async sendNewChapterEmail(
    to: string,
    storyTitle: string,
    chapterTitle: string,
    chapterNumber: number,
    authorName: string,
    storyId: string,
    chapterId: string,
  ): Promise<boolean> {
    const chapterUrl = `${this.appUrl}/stories/${storyId}/chapters/${chapterId}`;

    const html = this.wrapHtml(`
      <h2>New Chapter Published!</h2>
      <p><strong>${authorName}</strong> just published a new chapter:</p>
      <h3>${storyTitle}</h3>
      <p>Chapter ${chapterNumber}: <strong>${chapterTitle}</strong></p>
      <a href="${chapterUrl}" class="button">Read Now</a>
    `);

    return this.sendEmail({
      to,
      subject: `📖 New chapter in "${storyTitle}" - ${chapterTitle}`,
      html,
      text: `${authorName} published Chapter ${chapterNumber}: ${chapterTitle} in "${storyTitle}". Read it at ${chapterUrl}`,
    });
  }

  // New follower notification
  async sendNewFollowerEmail(
    to: string,
    followerUsername: string,
    followerDisplayName: string,
  ): Promise<boolean> {
    const profileUrl = `${this.appUrl}/users/${followerUsername}`;
    const name = followerDisplayName || followerUsername;

    const html = this.wrapHtml(`
      <h2>New Follower!</h2>
      <p><strong>${name}</strong> (@${followerUsername}) started following you.</p>
      <a href="${profileUrl}" class="button">View Profile</a>
    `);

    return this.sendEmail({
      to,
      subject: `👤 ${name} is now following you on ${this.appName}`,
      html,
      text: `${name} (@${followerUsername}) started following you. View their profile at ${profileUrl}`,
    });
  }

  // Comment notification
  async sendCommentEmail(
    to: string,
    commenterName: string,
    storyTitle: string,
    commentPreview: string,
    storyId: string,
  ): Promise<boolean> {
    const storyUrl = `${this.appUrl}/stories/${storyId}`;

    const html = this.wrapHtml(`
      <h2>New Comment on Your Story</h2>
      <p><strong>${commenterName}</strong> commented on <strong>${storyTitle}</strong>:</p>
      <blockquote style="border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0; color: #4b5563;">
        "${commentPreview.substring(0, 200)}${commentPreview.length > 200 ? '...' : ''}"
      </blockquote>
      <a href="${storyUrl}" class="button">View Comment</a>
    `);

    return this.sendEmail({
      to,
      subject: `💬 ${commenterName} commented on "${storyTitle}"`,
      html,
      text: `${commenterName} commented on "${storyTitle}": "${commentPreview}". View at ${storyUrl}`,
    });
  }

  // New review notification
  async sendReviewEmail(
    to: string,
    reviewerName: string,
    storyTitle: string,
    rating: number,
    reviewPreview: string,
    storyId: string,
  ): Promise<boolean> {
    const storyUrl = `${this.appUrl}/stories/${storyId}`;
    const stars = '⭐'.repeat(rating);

    const html = this.wrapHtml(`
      <h2>New Review!</h2>
      <p><strong>${reviewerName}</strong> left a ${rating}-star review on <strong>${storyTitle}</strong>:</p>
      <p style="font-size: 24px; margin: 16px 0;">${stars}</p>
      <blockquote style="border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0; color: #4b5563;">
        "${reviewPreview.substring(0, 200)}${reviewPreview.length > 200 ? '...' : ''}"
      </blockquote>
      <a href="${storyUrl}" class="button">View Review</a>
    `);

    return this.sendEmail({
      to,
      subject: `⭐ ${reviewerName} reviewed "${storyTitle}" (${rating}/5)`,
      html,
      text: `${reviewerName} gave "${storyTitle}" ${rating}/5 stars: "${reviewPreview}". View at ${storyUrl}`,
    });
  }

  // Tip received notification
  async sendTipEmail(
    to: string,
    tipperName: string,
    amount: number,
    storyTitle: string | null,
    message: string | null,
  ): Promise<boolean> {
    const formattedAmount = `$${(amount / 100).toFixed(2)}`;

    let content = `
      <h2>You Received a Tip! 🎉</h2>
      <p><strong>${tipperName}</strong> sent you <strong>${formattedAmount}</strong>`;

    if (storyTitle) {
      content += ` for <strong>${storyTitle}</strong>`;
    }
    content += `.</p>`;

    if (message) {
      content += `
      <blockquote style="border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0; color: #4b5563;">
        "${message}"
      </blockquote>`;
    }

    content += `<p>Thank you for creating amazing content!</p>`;

    const html = this.wrapHtml(content);

    return this.sendEmail({
      to,
      subject: `💰 ${tipperName} sent you ${formattedAmount}!`,
      html,
      text: `${tipperName} sent you ${formattedAmount}${storyTitle ? ` for "${storyTitle}"` : ''}${message ? `: "${message}"` : ''}`,
    });
  }

  // Collaboration invitation
  async sendCollaborationInviteEmail(
    to: string,
    inviterName: string,
    storyTitle: string,
    role: string,
    message: string | null,
  ): Promise<boolean> {
    const invitationsUrl = `${this.appUrl}/dashboard/invitations`;

    let content = `
      <h2>Collaboration Invitation</h2>
      <p><strong>${inviterName}</strong> invited you to collaborate on <strong>${storyTitle}</strong> as a <strong>${role}</strong>.</p>`;

    if (message) {
      content += `
      <blockquote style="border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0; color: #4b5563;">
        "${message}"
      </blockquote>`;
    }

    content += `<a href="${invitationsUrl}" class="button">View Invitation</a>`;

    const html = this.wrapHtml(content);

    return this.sendEmail({
      to,
      subject: `🤝 ${inviterName} invited you to collaborate on "${storyTitle}"`,
      html,
      text: `${inviterName} invited you to collaborate on "${storyTitle}" as a ${role}. View at ${invitationsUrl}`,
    });
  }

  // Welcome email
  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    const dashboardUrl = `${this.appUrl}/dashboard`;

    const html = this.wrapHtml(`
      <h2>Welcome to ${this.appName}!</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Thanks for joining ${this.appName}! We're excited to have you in our community of readers and writers.</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>📖 Discover amazing stories from talented authors</li>
        <li>✍️ Share your own creative writing</li>
        <li>💬 Connect with other readers and writers</li>
        <li>📚 Build your reading lists</li>
      </ul>
      <a href="${dashboardUrl}" class="button">Get Started</a>
    `);

    return this.sendEmail({
      to,
      subject: `Welcome to ${this.appName}! 📚`,
      html,
      text: `Welcome to ${this.appName}, ${username}! Start exploring at ${dashboardUrl}`,
    });
  }
}
