import { Controller, Post, Get, Body, Headers, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '@rea/shared-types';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string }): Promise<AuthResponse> {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<AuthResponse> {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string): Promise<User> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.verifyToken(token);
  }
}
