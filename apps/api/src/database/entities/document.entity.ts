import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CanvasElementEntity } from './canvas-element.entity';
import { ProjectEntity } from './project.entity';

@Entity('whiteboard_documents')
export class DocumentEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64, default: 'proj-default' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, (p) => p.files, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', default: '' })
  notes: string;

  @Column({ type: 'varchar', length: 32, default: 'split' })
  viewMode: 'canvas' | 'split' | 'notes';

  @Column({ type: 'varchar', length: 32, default: 'dark' })
  canvasTheme: 'light' | 'dark';

  @Column({ type: 'boolean', default: true })
  gridVisible: boolean;

  @Column({ type: 'boolean', default: true })
  gridSnap: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => CanvasElementEntity, (element) => element.document, {
    cascade: true,
    eager: true,
  })
  elements: CanvasElementEntity[];
}
