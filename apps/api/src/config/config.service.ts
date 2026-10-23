import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  get port(): number {
    return parseInt(process.env.PORT || process.env.API_PORT || '3333', 10);
  }

  get databaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
      this.logger.warn('DATABASE_URL is not set! Using default local PostgreSQL URL.');
      return 'postgresql://umangsailor:Umang6Sailor@localhost:5432/sailboard?schema=public';
    }
    return url;
  }

  get databaseSsl(): boolean | { rejectUnauthorized: boolean } {
    const url = this.databaseUrl;
    // Only enable SSL if explicitly requested via DATABASE_SSL=true or sslmode=require in the connection string
    if (process.env.DATABASE_SSL === 'true' || url.includes('sslmode=require')) {
      return { rejectUnauthorized: false };
    }
    return false;
  }

  get redisHost(): string {
    return process.env.REDIS_HOST || 'localhost';
  }

  get redisPort(): number {
    return parseInt(process.env.REDIS_PORT || '6379', 10);
  }

  get redisPassword(): string | undefined {
    const pass = process.env.REDIS_PASSWORD;
    return pass && pass.trim().length > 0 ? pass.trim() : undefined;
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'sailboard_super_secret_jwt_key_2026';
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
