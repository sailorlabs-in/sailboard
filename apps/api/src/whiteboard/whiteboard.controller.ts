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
  Inject,
} from '@nestjs/common';
import { WhiteboardService } from './whiteboard.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  CanvasElement,
  WhiteboardDocument,
  DocumentExportData,
} from '@rea/shared-types';

@Controller('documents')
export class WhiteboardController {
  constructor(@Inject(WhiteboardService) private readonly whiteboardService: WhiteboardService) {}

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
}
