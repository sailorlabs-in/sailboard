import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { WhiteboardDocument, UserPresence } from '@rea/shared-types';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private isConnected = false;

  constructor(
    @Inject(AppConfigService)
    private readonly configService: AppConfigService
  ) {}

  onModuleInit() {
    const host = this.configService.redisHost;
    const port = this.configService.redisPort;
    const password = this.configService.redisPassword;

    const redisOptions: any = {
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    };

    try {
      this.client = new Redis(redisOptions);
      this.pubClient = new Redis(redisOptions);
      this.subClient = new Redis(redisOptions);

      this.client.connect().then(() => {
        this.isConnected = true;
        this.logger.log(`Redis connected successfully to ${host}:${port}!`);
      }).catch((err) => {
        this.logger.warn(`Redis connection failed: ${err.message}. Operating in resilient fallback mode.`);
      });

      this.pubClient.connect().catch((err) => this.logger.warn(`Redis pub client: ${err.message}`));
      this.subClient.connect().catch((err) => this.logger.warn(`Redis sub client: ${err.message}`));
    } catch (e: any) {
      this.logger.warn(`Redis init error: ${e.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
    if (this.pubClient) await this.pubClient.quit();
    if (this.subClient) await this.subClient.quit();
  }

  // --- Document Cache ---

  async getCachedDocument(id: string): Promise<WhiteboardDocument | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const data = await this.client.get(`document:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (err: any) {
      this.logger.warn(`Redis get error: ${err.message}`);
      return null;
    }
  }

  async cacheDocument(id: string, doc: WhiteboardDocument, ttlSeconds = 300): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.set(`document:${id}`, JSON.stringify(doc), 'EX', ttlSeconds);
    } catch (err: any) {
      this.logger.warn(`Redis set error: ${err.message}`);
    }
  }

  async invalidateDocument(id: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(`document:${id}`);
    } catch (err: any) {
      this.logger.warn(`Redis del error: ${err.message}`);
    }
  }

  // --- Pub/Sub ---

  async publish(channel: string, message: any): Promise<void> {
    if (!this.pubClient) return;
    try {
      await this.pubClient.publish(channel, JSON.stringify(message));
    } catch (err: any) {
      this.logger.warn(`Redis publish error: ${err.message}`);
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.subClient) return;
    try {
      await this.subClient.subscribe(channel);
      this.subClient.on('message', (chan, msg) => {
        if (chan === channel) {
          try {
            callback(JSON.parse(msg));
          } catch {
            callback(msg);
          }
        }
      });
    } catch (err: any) {
      this.logger.warn(`Redis subscribe error: ${err.message}`);
    }
  }

  // --- Presence Tracking ---

  async setUserPresence(docId: string, user: UserPresence): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.hset(`presence:${docId}`, user.userId, JSON.stringify(user));
      await this.client.expire(`presence:${docId}`, 1800); // 30 min TTL
    } catch (err: any) {
      this.logger.warn(`Redis setUserPresence error: ${err.message}`);
    }
  }

  async removeUserPresence(docId: string, userId: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.hdel(`presence:${docId}`, userId);
    } catch (err: any) {
      this.logger.warn(`Redis removeUserPresence error: ${err.message}`);
    }
  }

  async getPresences(docId: string): Promise<UserPresence[]> {
    if (!this.isConnected || !this.client) return [];
    try {
      const records = await this.client.hgetall(`presence:${docId}`);
      return Object.values(records).map((str) => JSON.parse(str));
    } catch (err: any) {
      this.logger.warn(`Redis getPresences error: ${err.message}`);
      return [];
    }
  }
}
