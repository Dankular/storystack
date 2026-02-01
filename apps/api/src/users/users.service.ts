import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const normalized = emailOrUsername.toLowerCase();
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { username: normalized }],
      },
    });
  }

  async create(data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }): Promise<User> {
    const email = data.email.toLowerCase();
    const username = data.username.toLowerCase();

    // Check for existing user
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already in use');
      }
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: data.displayName || username,
      },
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  excludePassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            stories: true,
            followers: true,
            followedAuthors: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      storyCount: user._count.stories,
      followerCount: user._count.followers,
      followingCount: user._count.followedAuthors,
    };
  }
}
