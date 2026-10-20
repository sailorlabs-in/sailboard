import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from '../database/entities/document.entity';
import { CanvasElementEntity } from '../database/entities/canvas-element.entity';
import { CommentEntity } from '../database/entities/comment.entity';
import { WhiteboardController } from './whiteboard.controller';
import { WhiteboardService } from './whiteboard.service';
import { WhiteboardGateway } from './whiteboard.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity, CanvasElementEntity, CommentEntity])],
  controllers: [WhiteboardController],
  providers: [WhiteboardService, WhiteboardGateway],
  exports: [WhiteboardService],
})
export class WhiteboardModule {}
