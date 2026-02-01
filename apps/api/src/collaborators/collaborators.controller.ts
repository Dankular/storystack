import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { JwtAuthGuard, CurrentUser } from '../auth';
import { CollaboratorRole } from '@prisma/client';

class InviteCollaboratorDto {
  username: string;
  role: CollaboratorRole;
  canPublish?: boolean;
  message?: string;
}

class UpdateCollaboratorDto {
  role?: CollaboratorRole;
  canPublish?: boolean;
}

class RespondToInvitationDto {
  accept: boolean;
}

@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  // Get my collaborations (stories I'm collaborating on)
  @UseGuards(JwtAuthGuard)
  @Get('my-collaborations')
  async getMyCollaborations(@CurrentUser('id') userId: string) {
    return this.collaboratorsService.getMyCollaborations(userId);
  }

  // Get my pending invitations
  @UseGuards(JwtAuthGuard)
  @Get('invitations')
  async getPendingInvitations(@CurrentUser('id') userId: string) {
    return this.collaboratorsService.getPendingInvitations(userId);
  }

  // Respond to an invitation
  @UseGuards(JwtAuthGuard)
  @Post('invitations/:invitationId/respond')
  async respondToInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RespondToInvitationDto,
  ) {
    return this.collaboratorsService.respondToInvitation(
      invitationId,
      userId,
      dto.accept,
    );
  }

  // Get collaborators for a story
  @UseGuards(JwtAuthGuard)
  @Get('stories/:storyId')
  async getStoryCollaborators(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.collaboratorsService.getStoryCollaborators(storyId, userId);
  }

  // Invite a collaborator to a story
  @UseGuards(JwtAuthGuard)
  @Post('stories/:storyId/invite')
  async inviteCollaborator(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InviteCollaboratorDto,
  ) {
    return this.collaboratorsService.inviteCollaborator(
      storyId,
      userId,
      dto.username,
      dto.role,
      dto.canPublish ?? false,
      dto.message,
    );
  }

  // Get sent invitations for a story
  @UseGuards(JwtAuthGuard)
  @Get('stories/:storyId/invitations')
  async getSentInvitations(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.collaboratorsService.getSentInvitations(storyId, userId);
  }

  // Cancel an invitation
  @UseGuards(JwtAuthGuard)
  @Delete('invitations/:invitationId')
  async cancelInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.collaboratorsService.cancelInvitation(invitationId, userId);
  }

  // Update a collaborator's role/permissions
  @UseGuards(JwtAuthGuard)
  @Put('stories/:storyId/collaborators/:collaboratorId')
  async updateCollaborator(
    @Param('storyId') storyId: string,
    @Param('collaboratorId') collaboratorId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCollaboratorDto,
  ) {
    return this.collaboratorsService.updateCollaborator(
      storyId,
      collaboratorId,
      userId,
      dto.role,
      dto.canPublish,
    );
  }

  // Remove a collaborator
  @UseGuards(JwtAuthGuard)
  @Delete('stories/:storyId/collaborators/:collaboratorId')
  async removeCollaborator(
    @Param('storyId') storyId: string,
    @Param('collaboratorId') collaboratorId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.collaboratorsService.removeCollaborator(
      storyId,
      collaboratorId,
      userId,
    );
  }
}
