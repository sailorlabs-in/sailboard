import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
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
  private readonly logger = new Logger(AuthService.name);

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

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    return user ? this.toUserDto(user) : null;
  }
}
