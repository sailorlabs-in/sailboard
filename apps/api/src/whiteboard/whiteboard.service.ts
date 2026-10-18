import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from '../database/entities/document.entity';
import { CanvasElementEntity } from '../database/entities/canvas-element.entity';
import { RedisService } from '../redis/redis.service';
import {
  WhiteboardDocument,
  CreateDocumentDto,
  UpdateDocumentDto,
  CanvasElement,
  DocumentExportData,
} from '@rea/shared-types';

@Injectable()
export class WhiteboardService implements OnModuleInit {
  private readonly logger = new Logger(WhiteboardService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,
    @InjectRepository(CanvasElementEntity)
    private readonly elementRepo: Repository<CanvasElementEntity>,
    @Inject(RedisService)
    private readonly redisService: RedisService
  ) {}

  async onModuleInit() {
    // ProjectService seeds projects and documents
  }

  private async seedInitialDocumentIfEmpty() {
    try {
      const count = await this.docRepo.count();
      if (count === 0) {
        this.logger.log('Seeding initial architecture document into PostgreSQL...');
        const demoId = 'doc-welcome-sample';

        const sampleElements: CanvasElement[] = [
          {
            id: 'el-1',
            type: 'rectangle',
            x: 220,
            y: 120,
            width: 200,
            height: 90,
            angle: 0,
            strokeColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fillStyle: 'hachure',
            strokeWidth: 2,
            strokeStyle: 'solid',
            roughness: 1,
            opacity: 100,
            seed: 12345,
            version: 1,
            versionNonce: 54321,
            isDeleted: false,
            updatedAt: Date.now(),
            text: 'Client Web App\n(React + MUI)',
            fontSize: 16,
            textAlign: 'center',
          },
          {
            id: 'el-2',
            type: 'arrow',
            x: 420,
            y: 165,
            width: 140,
            height: 0,
            angle: 0,
            strokeColor: '#94a3b8',
            backgroundColor: 'transparent',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            roughness: 1,
            opacity: 100,
            seed: 67890,
            version: 1,
            versionNonce: 98765,
            isDeleted: false,
            updatedAt: Date.now(),
            points: [
              { x: 0, y: 0 },
              { x: 140, y: 0 },
            ],
            endArrowhead: 'arrow',
          },
          {
            id: 'el-3',
            type: 'diamond',
            x: 560,
            y: 110,
            width: 160,
            height: 110,
            angle: 0,
            strokeColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fillStyle: 'solid',
            strokeWidth: 2,
            strokeStyle: 'solid',
            roughness: 1,
            opacity: 100,
            seed: 23456,
            version: 1,
            versionNonce: 65432,
            isDeleted: false,
            updatedAt: Date.now(),
            text: 'API Gateway\n(Nest.js)',
            fontSize: 15,
            textAlign: 'center',
          },
          {
            id: 'el-4',
            type: 'arrow',
            x: 720,
            y: 165,
            width: 130,
            height: 0,
            angle: 0,
            strokeColor: '#94a3b8',
            backgroundColor: 'transparent',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            roughness: 1,
            opacity: 100,
            seed: 34567,
            version: 1,
            versionNonce: 76543,
            isDeleted: false,
            updatedAt: Date.now(),
            points: [
              { x: 0, y: 0 },
              { x: 130, y: 0 },
            ],
            endArrowhead: 'arrow',
          },
          {
            id: 'el-5',
            type: 'ellipse',
            x: 850,
            y: 115,
            width: 170,
            height: 100,
            angle: 0,
            strokeColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            fillStyle: 'cross-hatch',
            strokeWidth: 2,
            strokeStyle: 'solid',
            roughness: 1,
            opacity: 100,
            seed: 45678,
            version: 1,
            versionNonce: 87654,
            isDeleted: false,
            updatedAt: Date.now(),
            text: 'PostgreSQL DB\n(TypeORM Schema)',
            fontSize: 15,
            textAlign: 'center',
          },
          {
            id: 'el-6',
            type: 'sticky',
            x: 230,
            y: 280,
            width: 190,
            height: 130,
            angle: -0.03,
            strokeColor: '#f59e0b',
            backgroundColor: '#fef3c7',
            fillStyle: 'solid',
            strokeWidth: 1.5,
            strokeStyle: 'solid',
            roughness: 0,
            opacity: 95,
            seed: 56789,
            version: 1,
            versionNonce: 98760,
            isDeleted: false,
            updatedAt: Date.now(),
            text: 'Redis Pub/Sub:\nLive collaboration &\nmultiplayer cursors!',
            fontSize: 14,
            textAlign: 'left',
          },
        ];

        const docEntity = this.docRepo.create({
          id: demoId,
          title: 'System Architecture & Engineering Canvas',
          description: 'Live architecture documentation with PostgreSQL & Redis',
          notes: `# Engineering System Architecture

Welcome to the **Eraser & Excalidraw** workspace!
This unified platform combines Markdown documentation with an infinite whiteboard canvas.

### Architecture Highlights:
- **Frontend**: React 19 + Material-UI (MUI v6) + TypeScript + Rough.js
- **Backend**: Nest.js + TypeORM + PostgreSQL (192.168.1.2) + Redis (192.168.1.2) + WebSockets
- **Dual Mode**: Split screen for Notes & Canvas, or full-screen Excalidraw canvas

### Core Stack:
- [x] TypeORM Entity Modeling with PostgreSQL persistence
- [x] Redis Distributed Caching & Pub/Sub
- [x] Socket.io Real-time Gateway with room channels
`,
          viewMode: 'split',
          canvasTheme: 'dark',
          gridVisible: true,
          gridSnap: true,
          version: 1,
        });

        await this.docRepo.save(docEntity);

        const elementEntities = sampleElements.map((el) =>
          this.elementRepo.create({
            ...el,
            documentId: demoId,
          })
        );
        await this.elementRepo.save(elementEntities);

        this.logger.log('Initial document seeded successfully.');
      }
    } catch (err: any) {
      this.logger.error(`Seed initial document error: ${err.message}`);
    }
  }

  // --- Map Helper ---
  private toModel(entity: DocumentEntity): WhiteboardDocument {
    return {
      id: entity.id,
      projectId: entity.projectId || 'proj-sailboard-demo',
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
        points: el.points,
        boundElements: el.boundElements,
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
          points: el.points,
          boundElements: el.boundElements,
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
}
