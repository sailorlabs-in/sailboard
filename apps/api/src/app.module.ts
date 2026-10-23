import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { UserEntity } from './database/entities/user.entity';
import { ProjectEntity } from './database/entities/project.entity';
import { ProjectMemberEntity } from './database/entities/project-member.entity';
import { DocumentEntity } from './database/entities/document.entity';
import { CanvasElementEntity } from './database/entities/canvas-element.entity';
import { CommentEntity } from './database/entities/comment.entity';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { RedisModule } from './redis/redis.module';
import { WhiteboardModule } from './whiteboard/whiteboard.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        type: 'postgres',
        url: config.databaseUrl,
        ssl: config.databaseSsl,
        entities: [
          UserEntity,
          ProjectEntity,
          ProjectMemberEntity,
          DocumentEntity,
          CanvasElementEntity,
          CommentEntity,
        ],
        synchronize: true, // Auto synchronize TypeORM entity tables in PostgreSQL
        logging: config.isProduction ? false : ['error', 'warn'],
      }),
    }),
    AuthModule,
    ProjectModule,
    RedisModule,
    WhiteboardModule,
  ],
})
export class AppModule {}
