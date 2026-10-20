import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CommentAuthor, CommentReply } from '@rea/shared-types';

@Entity('canvas_comments')
export class CommentEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  documentId: string;

  @Column({ type: 'float' })
  x: number;

  @Column({ type: 'float' })
  y: number;

  @Column({ type: 'jsonb' })
  author: CommentAuthor;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ type: 'jsonb', default: [] })
  replies: CommentReply[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
