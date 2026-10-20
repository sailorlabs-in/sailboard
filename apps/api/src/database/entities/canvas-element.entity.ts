import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DocumentEntity } from './document.entity';
import { ElementType, FillStyle, StrokeStyle } from '@rea/shared-types';

@Entity('canvas_elements')
export class CanvasElementEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  documentId: string;

  @ManyToOne(() => DocumentEntity, (doc) => doc.elements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @Column({ type: 'varchar', length: 32 })
  type: ElementType;

  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  @Column({ type: 'float', default: 0 })
  width: number;

  @Column({ type: 'float', default: 0 })
  height: number;

  @Column({ type: 'float', default: 0 })
  angle: number;

  @Column({ type: 'varchar', length: 64, default: '#6366f1' })
  strokeColor: string;

  @Column({ type: 'varchar', length: 64, default: 'transparent' })
  backgroundColor: string;

  @Column({ type: 'varchar', length: 32, default: 'solid' })
  fillStyle: FillStyle;

  @Column({ type: 'float', default: 2 })
  strokeWidth: number;

  @Column({ type: 'varchar', length: 32, default: 'solid' })
  strokeStyle: StrokeStyle;

  @Column({ type: 'float', default: 1 })
  roughness: number;

  @Column({ type: 'float', default: 100 })
  opacity: number;

  @Column({ type: 'int', default: 1 })
  seed: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'int', default: 1 })
  versionNonce: number;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'int', nullable: true })
  fontSize: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  textAlign: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  textColor: string;

  @Column({ type: 'jsonb', nullable: true })
  points: any;

  @Column({ type: 'jsonb', nullable: true })
  boundElements: any;

  @Column({ type: 'jsonb', nullable: true })
  startBinding: any;

  @Column({ type: 'jsonb', nullable: true })
  endBinding: any;

  @Column({ type: 'varchar', length: 32, nullable: true })
  startArrowhead: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  endArrowhead: string;

  @Column({ type: 'int', nullable: true })
  zIndex: number;

  @Column({ type: 'bigint', default: 0 })
  updatedAt: number;
}
