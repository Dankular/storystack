import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CollaboratorRole, InvitationStatus } from '@prisma/client';

@Injectable()
export class CollaboratorsService {
  constructor(private prisma: PrismaService) {}

  async getStoryCollaborators(storyId: string, userId: string) {
    // Verify the story exists and user has access
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      include: {
        collaborators: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Check if user is owner or collaborator
    const isOwner = story.authorId === userId;
    const isCollaborator = story.collaborators.some((c) => c.userId === userId);

    if (!isOwner && !isCollaborator) {
      throw new ForbiddenException('You do not have access to this story');
    }

    return story.collaborators;
  }

  async inviteCollaborator(
    storyId: string,
    inviterId: string,
    inviteeUsername: string,
    role: CollaboratorRole,
    canPublish: boolean,
    message?: string,
  ) {
    // Verify story exists and inviter is owner
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== inviterId) {
      throw new ForbiddenException('Only the story owner can invite collaborators');
    }

    // Find the invitee by username
    const invitee = await this.prisma.user.findUnique({
      where: { username: inviteeUsername },
    });

    if (!invitee) {
      throw new NotFoundException('User not found');
    }

    if (invitee.id === inviterId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    // Check if already a collaborator
    const existingCollaborator = await this.prisma.storyCollaborator.findUnique({
      where: {
        storyId_userId: { storyId, userId: invitee.id },
      },
    });

    if (existingCollaborator) {
      throw new BadRequestException('User is already a collaborator');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.collaboratorInvitation.findFirst({
      where: {
        storyId,
        inviteeId: invitee.id,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('An invitation is already pending for this user');
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.collaboratorInvitation.create({
      data: {
        storyId,
        inviterId,
        inviteeId: invitee.id,
        role,
        canPublish,
        message,
        expiresAt,
      },
      include: {
        story: { select: { title: true } },
        invitee: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    // Create notification for the invitee
    await this.prisma.notification.create({
      data: {
        userId: invitee.id,
        type: 'NEW_FOLLOWER', // Reusing notification type for now
        message: `You've been invited to collaborate on "${story.title}"`,
        data: { invitationId: invitation.id, storyId },
      },
    });

    return invitation;
  }

  async getPendingInvitations(userId: string) {
    return this.prisma.collaboratorInvitation.findMany({
      where: {
        inviteeId: userId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        story: {
          select: { id: true, title: true, coverImageUrl: true },
        },
        inviter: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentInvitations(storyId: string, userId: string) {
    // Verify story ownership
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story || story.authorId !== userId) {
      throw new ForbiddenException('Only the story owner can view sent invitations');
    }

    return this.prisma.collaboratorInvitation.findMany({
      where: { storyId },
      include: {
        invitee: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToInvitation(
    invitationId: string,
    userId: string,
    accept: boolean,
  ) {
    const invitation = await this.prisma.collaboratorInvitation.findUnique({
      where: { id: invitationId },
      include: {
        story: { select: { id: true, title: true, authorId: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation has already been responded to');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.collaboratorInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This invitation has expired');
    }

    const newStatus = accept ? InvitationStatus.ACCEPTED : InvitationStatus.DECLINED;

    const updatedInvitation = await this.prisma.collaboratorInvitation.update({
      where: { id: invitationId },
      data: {
        status: newStatus,
        respondedAt: new Date(),
      },
    });

    if (accept) {
      // Create the collaborator relationship
      await this.prisma.storyCollaborator.create({
        data: {
          storyId: invitation.storyId,
          userId,
          role: invitation.role,
          canPublish: invitation.canPublish,
        },
      });

      // Notify the story owner
      await this.prisma.notification.create({
        data: {
          userId: invitation.story.authorId,
          type: 'NEW_FOLLOWER',
          message: `Your collaboration invitation for "${invitation.story.title}" was accepted`,
          data: { storyId: invitation.storyId, collaboratorId: userId },
        },
      });
    }

    return updatedInvitation;
  }

  async updateCollaborator(
    storyId: string,
    collaboratorUserId: string,
    ownerId: string,
    role?: CollaboratorRole,
    canPublish?: boolean,
  ) {
    // Verify story ownership
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story || story.authorId !== ownerId) {
      throw new ForbiddenException('Only the story owner can update collaborators');
    }

    const collaborator = await this.prisma.storyCollaborator.findUnique({
      where: {
        storyId_userId: { storyId, userId: collaboratorUserId },
      },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    return this.prisma.storyCollaborator.update({
      where: { id: collaborator.id },
      data: {
        ...(role !== undefined && { role }),
        ...(canPublish !== undefined && { canPublish }),
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async removeCollaborator(
    storyId: string,
    collaboratorUserId: string,
    requesterId: string,
  ) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Allow owner to remove anyone, or collaborator to remove themselves
    const isOwner = story.authorId === requesterId;
    const isSelf = collaboratorUserId === requesterId;

    if (!isOwner && !isSelf) {
      throw new ForbiddenException('You do not have permission to remove this collaborator');
    }

    const collaborator = await this.prisma.storyCollaborator.findUnique({
      where: {
        storyId_userId: { storyId, userId: collaboratorUserId },
      },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.prisma.storyCollaborator.delete({
      where: { id: collaborator.id },
    });

    return { success: true };
  }

  async cancelInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.collaboratorInvitation.findUnique({
      where: { id: invitationId },
      include: { story: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.story.authorId !== userId) {
      throw new ForbiddenException('Only the story owner can cancel invitations');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation cannot be cancelled');
    }

    await this.prisma.collaboratorInvitation.delete({
      where: { id: invitationId },
    });

    return { success: true };
  }

  async getMyCollaborations(userId: string) {
    return this.prisma.storyCollaborator.findMany({
      where: { userId },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            status: true,
            author: {
              select: { id: true, username: true, displayName: true },
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });
  }

  // Helper method to check if user can edit a story
  async canEditStory(storyId: string, userId: string): Promise<boolean> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      include: {
        collaborators: {
          where: {
            userId,
            role: { in: [CollaboratorRole.CO_AUTHOR, CollaboratorRole.EDITOR] },
          },
        },
      },
    });

    if (!story) return false;

    return story.authorId === userId || story.collaborators.length > 0;
  }

  // Helper method to check if user can publish chapters
  async canPublishChapter(storyId: string, userId: string): Promise<boolean> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      include: {
        collaborators: {
          where: {
            userId,
            canPublish: true,
          },
        },
      },
    });

    if (!story) return false;

    return story.authorId === userId || story.collaborators.length > 0;
  }
}
