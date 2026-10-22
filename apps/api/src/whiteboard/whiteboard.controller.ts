import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { WhiteboardService } from './whiteboard.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  CanvasElement,
  WhiteboardDocument,
  DocumentExportData,
  CanvasComment,
  CreateCommentDto,
  ReplyCommentDto,
  User,
} from '@rea/shared-types';

@Controller('documents')
export class WhiteboardController {
  constructor(
    @Inject(WhiteboardService) private readonly whiteboardService: WhiteboardService,
    @Inject(AuthService) private readonly authService: AuthService
  ) {}

  private async getOptionalAuthUser(authHeader?: string): Promise<User | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    try {
      const token = authHeader.split(' ')[1];
      return await this.authService.verifyToken(token);
    } catch {
      return null;
    }
  }

  @Get()
  async getAll(): Promise<WhiteboardDocument[]> {
    return this.whiteboardService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<WhiteboardDocument> {
    return this.whiteboardService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDocumentDto): Promise<WhiteboardDocument> {
    return this.whiteboardService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto
  ): Promise<WhiteboardDocument> {
    return this.whiteboardService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.whiteboardService.delete(id);
  }

  @Post(':id/elements')
  async syncElements(
    @Param('id') id: string,
    @Body() body: { elements: CanvasElement[] }
  ): Promise<CanvasElement[]> {
    return this.whiteboardService.syncElements(id, body.elements);
  }

  @Get(':id/export')
  async exportDocument(@Param('id') id: string): Promise<DocumentExportData> {
    return this.whiteboardService.exportDocument(id);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  async importDocument(@Body() data: any): Promise<WhiteboardDocument> {
    return this.whiteboardService.importDocument(data);
  }

  // --- Comment Pins ---

  @Get(':id/comments')
  async getComments(@Param('id') id: string): Promise<CanvasComment[]> {
    return this.whiteboardService.getComments(id);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Headers('authorization') authHeader?: string
  ): Promise<CanvasComment> {
    dto.documentId = id;
    const user = await this.getOptionalAuthUser(authHeader);
    return this.whiteboardService.createComment(dto, user);
  }

  @Post('comments/:commentId/reply')
  @HttpCode(HttpStatus.CREATED)
  async replyComment(
    @Param('commentId') commentId: string,
    @Body() dto: ReplyCommentDto,
    @Headers('authorization') authHeader?: string
  ): Promise<CanvasComment> {
    const user = await this.getOptionalAuthUser(authHeader);
    return this.whiteboardService.replyComment(commentId, dto, user);
  }

  @Put('comments/:commentId/resolve')
  async resolveComment(
    @Param('commentId') commentId: string,
    @Headers('authorization') authHeader?: string
  ): Promise<CanvasComment> {
    const user = await this.getOptionalAuthUser(authHeader);
    return this.whiteboardService.resolveComment(commentId, user);
  }

  @Delete('comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Headers('authorization') authHeader?: string
  ): Promise<{ success: boolean }> {
    const user = await this.getOptionalAuthUser(authHeader);
    const success = await this.whiteboardService.deleteComment(commentId, user);
    return { success };
  }
}
