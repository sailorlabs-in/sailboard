import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from '../database/entities/document.entity';
import { CanvasElementEntity } from '../database/entities/canvas-element.entity';
import { CommentEntity } from '../database/entities/comment.entity';
import { RedisService } from '../redis/redis.service';
import {
  WhiteboardDocument,
  CreateDocumentDto,
  UpdateDocumentDto,
  CanvasElement,
  DocumentExportData,
  CanvasComment,
  CreateCommentDto,
  ReplyCommentDto,
  CommentReply,
} from '@rea/shared-types';

@Injectable()
export class WhiteboardService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,
    @InjectRepository(CanvasElementEntity)
    private readonly elementRepo: Repository<CanvasElementEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,
    @Inject(RedisService)
    private readonly redisService: RedisService
  ) {}

  // --- Map Helper ---
  private toModel(entity: DocumentEntity): WhiteboardDocument {
    return {
      id: entity.id,
      projectId: entity.projectId || '',
      title: entity.title,
      description: entity.description,
      notes: entity.notes || '',
      viewMode: entity.viewMode || 'split',
      canvasTheme: entity.canvasTheme || 'dark',
      gridVisible: entity.gridVisible ?? true,
      gridSnap: entity.gridSnap ?? true,
      version: entity.version || 1,
      createdAt: entity.createdAt ? entity.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: entity.updatedAt ? entity.updatedAt.toISOString() : new Date().toISOString(),
      elements: (entity.elements || []).map((el) => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        angle: el.angle,
        strokeColor: el.strokeColor,
        backgroundColor: el.backgroundColor,
        fillStyle: el.fillStyle,
        strokeWidth: el.strokeWidth,
        strokeStyle: el.strokeStyle,
        roughness: el.roughness,
        opacity: el.opacity,
        seed: el.seed,
        version: el.version,
        versionNonce: el.versionNonce,
        isDeleted: el.isDeleted,
        text: el.text,
        fontSize: el.fontSize,
        textAlign: el.textAlign as any,
        textColor: el.textColor,
        points: el.points,
        boundElements: el.boundElements,
        startBinding: el.startBinding,
        endBinding: el.endBinding,
        startArrowhead: el.startArrowhead as any,
        endArrowhead: el.endArrowhead as any,
        zIndex: el.zIndex,
        updatedAt: Number(el.updatedAt) || Date.now(),
      })),
    };
  }

  // --- CRUD Operations ---

  async findAll(): Promise<WhiteboardDocument[]> {
    const entities = await this.docRepo.find({
      order: { updatedAt: 'DESC' },
      relations: { elements: true },
    });
    return entities.map((e) => this.toModel(e));
  }

  async findOne(id: string): Promise<WhiteboardDocument> {
    // 1. Check Redis cache
    const cached = await this.redisService.getCachedDocument(id);
    if (cached) return cached;

    // 2. Query TypeORM
    const entity = await this.docRepo.findOne({
      where: { id },
      relations: { elements: true },
    });

    if (!entity) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const doc = this.toModel(entity);
    await this.redisService.cacheDocument(id, doc);
    return doc;
  }

  async create(dto: CreateDocumentDto): Promise<WhiteboardDocument> {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const entity = this.docRepo.create({
      id,
      title: dto.title || 'Untitled Whiteboard',
      description: dto.description || '',
      notes: dto.notes || '# Notes\n\nStart writing notes...',
      viewMode: 'split',
      canvasTheme: 'dark',
      gridVisible: true,
      gridSnap: true,
      version: 1,
    });

    await this.docRepo.save(entity);

    if (dto.elements && dto.elements.length > 0) {
      const elementEntities = dto.elements.map((el) =>
        this.elementRepo.create({
          ...el,
          documentId: id,
        })
      );
      await this.elementRepo.save(elementEntities);
    }

    const created = await this.findOne(id);
    await this.redisService.cacheDocument(id, created);
    return created;
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<WhiteboardDocument> {
    const entity = await this.docRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Document ${id} not found`);

    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.notes !== undefined) entity.notes = dto.notes;
    if (dto.viewMode !== undefined) entity.viewMode = dto.viewMode;
    if (dto.canvasTheme !== undefined) entity.canvasTheme = dto.canvasTheme;
    if (dto.gridVisible !== undefined) entity.gridVisible = dto.gridVisible;
    if (dto.gridSnap !== undefined) entity.gridSnap = dto.gridSnap;
    entity.version = (entity.version || 1) + 1;

    await this.docRepo.save(entity);

    if (dto.elements !== undefined) {
      await this.syncElements(id, dto.elements);
    }

    await this.redisService.invalidateDocument(id);
    return this.findOne(id);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.elementRepo.delete({ documentId: id });
    const res = await this.docRepo.delete(id);
    await this.redisService.invalidateDocument(id);
    return { success: (res.affected || 0) > 0 };
  }

  async syncElements(documentId: string, elements: CanvasElement[]): Promise<CanvasElement[]> {
    if (elements.length > 0) {
      const entities = elements.map((el) =>
        this.elementRepo.create({
          id: el.id,
          documentId,
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          angle: el.angle || 0,
          strokeColor: el.strokeColor || '#6366f1',
          backgroundColor: el.backgroundColor || 'transparent',
          fillStyle: el.fillStyle || 'none',
          strokeWidth: el.strokeWidth || 2,
          strokeStyle: el.strokeStyle || 'solid',
          roughness: el.roughness ?? 1,
          opacity: el.opacity ?? 100,
          seed: el.seed || 1,
          version: el.version || 1,
          versionNonce: el.versionNonce || 1,
          isDeleted: el.isDeleted || false,
          text: el.text,
          fontSize: el.fontSize,
          textAlign: el.textAlign,
          textColor: el.textColor,
          points: el.points,
          boundElements: el.boundElements,
          startBinding: el.startBinding,
          endBinding: el.endBinding,
          startArrowhead: el.startArrowhead,
          endArrowhead: el.endArrowhead,
          zIndex: el.zIndex,
          updatedAt: el.updatedAt || Date.now(),
        })
      );

      // Atomic PostgreSQL upsert (ON CONFLICT (id) DO UPDATE)
      await this.elementRepo.upsert(entities, ['id']);

      // Clean up any removed elements that are no longer in this document
      const activeIds = elements.map((e) => e.id);
      await this.elementRepo
        .createQueryBuilder()
        .delete()
        .where('documentId = :documentId AND id NOT IN (:...activeIds)', { documentId, activeIds })
        .execute();
    } else {
      await this.elementRepo.delete({ documentId });
    }

    await this.redisService.invalidateDocument(documentId);
    return elements;
  }

  async exportDocument(id: string): Promise<DocumentExportData> {
    const doc = await this.findOne(id);
    return {
      version: 1,
      source: 'sailboard',
      timestamp: Date.now(),
      document: doc,
    };
  }

  async importDocument(data: any): Promise<WhiteboardDocument> {
    let elements: CanvasElement[] = [];
    let title = 'Imported Diagram';
    let notes = '# Imported Document\n\nImported from file.';

    if ((data.source === 'sailboard' || data.source === 'eraser-excalidraw-clone') && data.document) {
      return this.create({
        title: data.document.title || title,
        description: data.document.description || '',
        notes: data.document.notes || notes,
        elements: data.document.elements || [],
      });
    }

    if (Array.isArray(data.elements)) {
      elements = data.elements.map((el: any, index: number) => ({
        id: el.id || `el-imp-${index}`,
        type: el.type || 'rectangle',
        x: el.x || 100,
        y: el.y || 100,
        width: el.width || 120,
        height: el.height || 80,
        angle: el.angle || 0,
        strokeColor: el.strokeColor || '#1e293b',
        backgroundColor: el.backgroundColor || 'transparent',
        fillStyle: el.fillStyle || 'none',
        strokeWidth: el.strokeWidth || 2,
        strokeStyle: el.strokeStyle || 'solid',
        roughness: el.roughness ?? 1,
        opacity: el.opacity ?? 100,
        seed: el.seed || Math.floor(Math.random() * 100000),
        version: el.version || 1,
        versionNonce: el.versionNonce || Math.floor(Math.random() * 100000),
        isDeleted: el.isDeleted ?? false,
        updatedAt: Date.now(),
        text: el.text,
        textColor: el.textColor,
        points: el.points,
      }));
    }

    return this.create({
      title: data.title || title,
      description: 'Imported from JSON',
      notes,
      elements,
    });
  }

  // --- Comment Pin Operations ---

  private toCommentModel(entity: CommentEntity): CanvasComment {
    return {
      id: entity.id,
      documentId: entity.documentId,
      x: entity.x,
      y: entity.y,
      author: entity.author,
      content: entity.content,
      resolved: entity.resolved,
      replies: entity.replies || [],
      createdAt: entity.createdAt ? entity.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: entity.updatedAt ? entity.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getComments(documentId: string): Promise<CanvasComment[]> {
    const comments = await this.commentRepo.find({
      where: { documentId },
      order: { createdAt: 'ASC' },
    });
    return comments.map((c) => this.toCommentModel(c));
  }

  async createComment(dto: CreateCommentDto, user?: any): Promise<CanvasComment> {
    const id = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const author = dto.author || {
      id: user?.id || 'anonymous',
      name: user?.name || 'Anonymous Peer',
      color: user?.color || '#6366f1',
      email: user?.email,
    };

    const entity = this.commentRepo.create({
      id,
      documentId: dto.documentId,
      x: dto.x,
      y: dto.y,
      author,
      content: dto.content,
      resolved: false,
      replies: [],
    });

    const saved = await this.commentRepo.save(entity);
    return this.toCommentModel(saved);
  }

  async replyComment(commentId: string, dto: ReplyCommentDto, user?: any): Promise<CanvasComment> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    const replyId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const author = dto.author || {
      id: user?.id || 'anonymous',
      name: user?.name || 'Anonymous Peer',
      color: user?.color || '#6366f1',
      email: user?.email,
    };

    const newReply: CommentReply = {
      id: replyId,
      commentId,
      author,
      content: dto.content,
      createdAt: new Date().toISOString(),
    };

    comment.replies = [...(comment.replies || []), newReply];
    const saved = await this.commentRepo.save(comment);
    return this.toCommentModel(saved);
  }

  async resolveComment(commentId: string): Promise<CanvasComment> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    comment.resolved = !comment.resolved;
    const saved = await this.commentRepo.save(comment);
    return this.toCommentModel(saved);
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const res = await this.commentRepo.delete({ id: commentId });
    return (res.affected || 0) > 0;
  }
}
