import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from '../database/entities/user.entity';
import { User, AuthResponse } from '@rea/shared-types';

const getJwtSecret = () => process.env.JWT_SECRET || 'sailboard_super_secret_jwt_key_2026';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>
  ) {}

  private toUserDto(entity: UserEntity): User {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      color: entity.color,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const existing = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const user = this.userRepo.create({
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      passwordHash,
      color: randomColor,
    });

    await this.userRepo.save(user);

    const token = jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), {
      expiresIn: '7d',
    });

    return { token, user: this.toUserDto(user) };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), {
      expiresIn: '7d',
    });

    return { token, user: this.toUserDto(user) };
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; email: string };
      const user = await this.userRepo.findOne({ where: { id: decoded.userId } });
      if (!user) throw new UnauthorizedException('User not found');
      return this.toUserDto(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async updateProfile(userId: string, updates: { name?: string; color?: string }): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (updates.name !== undefined && updates.name.trim()) {
      user.name = updates.name.trim();
    }
    if (updates.color !== undefined && updates.color.trim()) {
      user.color = updates.color.trim();
    }
    await this.userRepo.save(user);
    return this.toUserDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    return user ? this.toUserDto(user) : null;
  }

  async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      throw new BadRequestException('No account found with this email address');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await this.userRepo.save(user);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!currentPassword) {
      throw new BadRequestException('Current password is required');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await this.userRepo.save(user);

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  }
}

