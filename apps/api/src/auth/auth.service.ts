import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password: dto.password,
      displayName: dto.displayName,
    });

    const tokens = this.generateTokens(user.id, user.email, user.username);

    return {
      user: this.usersService.excludePassword(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailOrUsername(dto.emailOrUsername);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id, user.email, user.username);

    return {
      user: this.usersService.excludePassword(user),
      ...tokens,
    };
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = this.generateTokens(user.id, user.email, user.username);

    return {
      user: this.usersService.excludePassword(user),
      ...tokens,
    };
  }

  private generateTokens(userId: string, email: string, username: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      username,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
