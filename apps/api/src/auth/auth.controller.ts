import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '@rea/shared-types';
import { JwtAuthGuard, CurrentUser } from '../common';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string }
  ): Promise<AuthResponse> {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string }
  ): Promise<AuthResponse> {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Body() body: { name?: string; color?: string }
  ): Promise<User> {
    return this.authService.updateProfile(user.id, body);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; newPassword: string }
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.resetPassword(body.email, body.newPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string }
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
