import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { WhiteboardDocument, CanvasElement } from '@rea/shared-types';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private isPostgresConnected = false;

  // In-memory fallback cache when PostgreSQL is not configured or offline
  private inMemoryDocuments: Map<string, WhiteboardDocument> = new Map();

  async onModuleInit() {
    await this.initDatabase();
      }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL connection pool closed');
    }
  }

  private async initDatabase() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://umang:secret123@localhost:5432/sailboard';

    try {
      this.pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 2000,
      });

      const client = await this.pool.connect();
      this.isPostgresConnected = true;
      this.logger.log('Successfully connected to PostgreSQL database!');

      // Create tables if they do not exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS whiteboard_documents (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          notes TEXT,
          view_mode VARCHAR(32) DEFAULT 'split',
          canvas_theme VARCHAR(32) DEFAULT 'dark',
          grid_visible BOOLEAN DEFAULT true,
          grid_snap BOOLEAN DEFAULT true,
          version INT DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS canvas_elements (
          id VARCHAR(64) PRIMARY KEY,
          document_id VARCHAR(64) REFERENCES whiteboard_documents(id) ON DELETE CASCADE,
          element_data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_canvas_elements_doc ON canvas_elements(document_id);
      `);

      client.release();
    } catch (err: any) {
      this.isPostgresConnected = false;
      this.logger.warn(`PostgreSQL is not available (${err.message}). Defaulting to resilient in-memory database store.`);
    }
  }

  // --- Document Operations ---


  async getAllDocuments(): Promise<WhiteboardDocument[]> {
    if (this.isPostgresConnected && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, title, description, notes, view_mode, canvas_theme, grid_visible, grid_snap, version, created_at, updated_at
           FROM whiteboard_documents ORDER BY updated_at DESC`
        );
        const docs: WhiteboardDocument[] = [];
        for (const row of res.rows) {
          const elementsRes = await this.pool.query(
            `SELECT element_data FROM canvas_elements WHERE document_id = $1`,
            [row.id]
          );
          docs.push({
            id: row.id,
            title: row.title,
            description: row.description,
            notes: row.notes || '',
            viewMode: row.view_mode || 'split',
            canvasTheme: row.canvas_theme || 'dark',
            gridVisible: row.grid_visible ?? true,
            gridSnap: row.grid_snap ?? true,
            version: row.version || 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            elements: elementsRes.rows.map((r) => r.element_data),
          });
        }
        return docs;
      } catch (e: any) {
        this.logger.error(`PostgreSQL query error, falling back to memory: ${e.message}`);
      }
    }
    return Array.from(this.inMemoryDocuments.values());
  }

  async getDocumentById(id: string): Promise<WhiteboardDocument | null> {
    if (this.isPostgresConnected && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, title, description, notes, view_mode, canvas_theme, grid_visible, grid_snap, version, created_at, updated_at
           FROM whiteboard_documents WHERE id = $1`,
          [id]
        );
        if (res.rows.length === 0) return null;
        const row = res.rows[0];

        const elementsRes = await this.pool.query(
          `SELECT element_data FROM canvas_elements WHERE document_id = $1`,
          [id]
        );

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          notes: row.notes || '',
          viewMode: row.view_mode || 'split',
          canvasTheme: row.canvas_theme || 'dark',
          gridVisible: row.grid_visible ?? true,
          gridSnap: row.grid_snap ?? true,
          version: row.version || 1,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          elements: elementsRes.rows.map((r) => r.element_data),
        };
      } catch (e: any) {
        this.logger.error(`PostgreSQL getById error, using memory: ${e.message}`);
      }
    }
    return this.inMemoryDocuments.get(id) || null;
  }

  async saveDocument(doc: WhiteboardDocument): Promise<WhiteboardDocument> {
    doc.updatedAt = new Date().toISOString();

    if (this.isPostgresConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO whiteboard_documents (id, title, description, notes, view_mode, canvas_theme, grid_visible, grid_snap, version, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             notes = EXCLUDED.notes,
             view_mode = EXCLUDED.view_mode,
             canvas_theme = EXCLUDED.canvas_theme,
             grid_visible = EXCLUDED.grid_visible,
             grid_snap = EXCLUDED.grid_snap,
             version = whiteboard_documents.version + 1,
             updated_at = EXCLUDED.updated_at`,
          [
            doc.id,
            doc.title,
            doc.description || '',
            doc.notes || '',
            doc.viewMode || 'split',
            doc.canvasTheme || 'dark',
            doc.gridVisible ?? true,
            doc.gridSnap ?? true,
            doc.version || 1,
            doc.createdAt || doc.updatedAt,
            doc.updatedAt,
          ]
        );

        // Sync elements in transaction or batch
        if (doc.elements) {
          await this.pool.query(`DELETE FROM canvas_elements WHERE document_id = $1`, [doc.id]);
          for (const el of doc.elements) {
            await this.pool.query(
              `INSERT INTO canvas_elements (id, document_id, element_data, updated_at)
               VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
              [el.id, doc.id, JSON.stringify(el)]
            );
          }
        }
      } catch (e: any) {
        this.logger.error(`PostgreSQL save error: ${e.message}`);
      }
    }

    this.inMemoryDocuments.set(doc.id, doc);
    return doc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (this.isPostgresConnected && this.pool) {
      try {
        await this.pool.query(`DELETE FROM canvas_elements WHERE document_id = $1`, [id]);
        await this.pool.query(`DELETE FROM whiteboard_documents WHERE id = $1`, [id]);
      } catch (e: any) {
        this.logger.error(`PostgreSQL delete error: ${e.message}`);
      }
    }
    return this.inMemoryDocuments.delete(id);
  }

  async syncElements(documentId: string, elements: CanvasElement[]): Promise<CanvasElement[]> {
    const doc = await this.getDocumentById(documentId);
    if (doc) {
      doc.elements = elements;
      await this.saveDocument(doc);
    }
    return elements;
  }
}
