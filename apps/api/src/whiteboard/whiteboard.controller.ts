import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { WhiteboardService } from './whiteboard.service';
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
import { OptionalJwtAuthGuard, CurrentUser } from '../common';

@Controller('documents')
export class WhiteboardController {
  constructor(
    @Inject(WhiteboardService) private readonly whiteboardService: WhiteboardService
  ) {}

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

  @Delete(':id/elements/:elementId')
  async deleteElement(
    @Param('id') documentId: string,
    @Param('elementId') elementId: string
  ): Promise<{ success: boolean }> {
    return this.whiteboardService.deleteElement(documentId, elementId);
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
  @UseGuards(OptionalJwtAuthGuard)
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User | null
  ): Promise<CanvasComment> {
    dto.documentId = id;
    return this.whiteboardService.createComment(dto, user);
  }

  @Post('comments/:commentId/reply')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  async replyComment(
    @Param('commentId') commentId: string,
    @Body() dto: ReplyCommentDto,
    @CurrentUser() user: User | null
  ): Promise<CanvasComment> {
    return this.whiteboardService.replyComment(commentId, dto, user);
  }

  @Put('comments/:commentId/resolve')
  @UseGuards(OptionalJwtAuthGuard)
  async resolveComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User | null
  ): Promise<CanvasComment> {
    return this.whiteboardService.resolveComment(commentId, user);
  }

  @Delete('comments/:commentId')
  @UseGuards(OptionalJwtAuthGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User | null
  ): Promise<{ success: boolean }> {
    const success = await this.whiteboardService.deleteComment(commentId, user);
    return { success };
  }
}
