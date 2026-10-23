import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      request.user = null;
      return true;
    }

    try {
      request.user = await this.authService.verifyToken(token);
    } catch {
      request.user = null;
    }

    return true;
  }
}
