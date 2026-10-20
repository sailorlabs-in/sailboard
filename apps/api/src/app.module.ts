import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url:
          process.env.DATABASE_URL ||
          'postgresql://umang:secret123@localhost:5432/sailboard?schema=public',
        entities: [
          UserEntity,
          ProjectEntity,
          ProjectMemberEntity,
          DocumentEntity,
          CanvasElementEntity,
          CommentEntity,
        ],
        synchronize: true, // Auto synchronize TypeORM entity tables in PostgreSQL
        logging: false,
      }),
    }),
    AuthModule,
    ProjectModule,
    RedisModule,
    WhiteboardModule,
  ],
})
export class AppModule {}
