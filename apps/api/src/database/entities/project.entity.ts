import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentEntity } from './document.entity';
import { ProjectMemberEntity } from './project-member.entity';

@Entity('projects')
export class ProjectEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 64 })
  ownerId: string;

  @Column({ type: 'varchar', length: 255, default: 'Owner' })
  ownerName: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => DocumentEntity, (doc) => doc.project, {
    cascade: true,
  })
  files: DocumentEntity[];

  @OneToMany(() => ProjectMemberEntity, (member) => member.project, {
    cascade: true,
  })
  members: ProjectMemberEntity[];
}
