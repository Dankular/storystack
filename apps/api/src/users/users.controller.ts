import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../auth';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Public()
  @Get(':username')
  async getProfile(@Param('username') username: string) {
    const profile = await this.usersService.getPublicProfile(username);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return profile;
  }
}
