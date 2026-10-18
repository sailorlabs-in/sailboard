import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  OnModuleInit,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../database/entities/project.entity';
import { ProjectMemberEntity } from '../database/entities/project-member.entity';
import { DocumentEntity } from '../database/entities/document.entity';
import { AuthService } from '../auth/auth.service';
import {
  Project,
  ProjectMember,
  ProjectRole,
  User,
  WhiteboardDocument,
} from '@rea/shared-types';

@Injectable()
export class ProjectService implements OnModuleInit {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(ProjectMemberEntity)
    private readonly memberRepo: Repository<ProjectMemberEntity>,
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,
    @Inject(AuthService)
    private readonly authService: AuthService
  ) {}

  async onModuleInit() {
    await this.seedInitialProject();
  }

  private async seedInitialProject() {
    try {
      const projId = 'proj-sailboard-demo';
      let project = await this.projectRepo.findOne({ where: { id: projId } });
      if (!project) {
        this.logger.log('Seeding demo project with multiple files and members...');
        project = this.projectRepo.create({
          id: projId,
          name: 'Sailboard Core Architecture',
          description: 'Production architecture diagrams, data flow and sprint boards',
          ownerId: 'user-alice-101',
          ownerName: 'Alice Walker',
        });
        await this.projectRepo.save(project);

        // Add Alice as Owner and Bob as Editor
        const aliceMember = this.memberRepo.create({
          id: 'mem-alice-1',
          projectId: projId,
          userId: 'user-alice-101',
          userEmail: 'alice@sailboard.io',
          userName: 'Alice Walker',
          role: 'owner',
        });

        const bobMember = this.memberRepo.create({
          id: 'mem-bob-2',
          projectId: projId,
          userId: 'user-bob-102',
          userEmail: 'bob@sailboard.io',
          userName: 'Bob Martinez',
          role: 'editor',
        });
        await this.memberRepo.save([aliceMember, bobMember]);
      }

      const docCount = await this.docRepo.count({ where: { projectId: projId } });
      if (docCount === 0) {
        this.logger.log('Seeding demo files for Sailboard Core Architecture...');
        // Create File A: Architecture Diagram
        const fileA = this.docRepo.create({
          id: 'doc-welcome-sample',
          projectId: projId,
          title: 'File A: System Architecture',
          description: 'Live architecture documentation with PostgreSQL & Redis',
          notes: `# Engineering System Architecture

Welcome to **Sailboard**!
This project combines Markdown documentation with an infinite whiteboard canvas.

### Architecture Highlights:
- **Frontend**: React 19 + Material-UI (MUI v6) + TypeScript + Rough.js
- **Backend**: Nest.js + TypeORM + PostgreSQL + Redis + WebSockets
- **Multi-File Workspace**: Switch between files A, B, and C in the sidebar!
- **Sharing & Roles**: Project Owner can invite collaborators as **Editor** or **Viewer**.

Try opening this project in two browser tabs as **Alice (Editor)** and **Bob (Editor or Viewer)**!
`,
          elements: [
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
          ] as any,
          viewMode: 'split',
          canvasTheme: 'dark',
          gridVisible: true,
          gridSnap: true,
          version: 1,
        });
        await this.docRepo.save(fileA);

        // Create File B: Redis Data Flow
        const fileB = this.docRepo.create({
          id: 'doc-file-b',
          projectId: projId,
          title: 'File B: Live Redis Data Flow',
          description: 'Pub/Sub and real-time state synchronization',
          notes: `# Live Redis Data Flow Spec

This document describes how **Sailboard** synchronizes concurrent user edits in real time.

### Components:
- **Socket.io Gateway**: Bi-directional event stream.
- **Redis Pub/Sub**: Multi-server cross-broadcast channel.
- **PostgreSQL**: Durable TypeORM storage.
`,
          elements: [],
          viewMode: 'split',
          canvasTheme: 'dark',
          gridVisible: true,
          gridSnap: true,
          version: 1,
        });
        await this.docRepo.save(fileB);

        // Create File C: Sprint Retrospective
        const fileC = this.docRepo.create({
          id: 'doc-file-c',
          projectId: projId,
          title: 'File C: Sprint Retrospective',
          description: 'Sprint planning and retrospective sticky notes',
          notes: `# Sprint Planning & Retrospective

Use colorful sticky notes to map out action items and roadmap goals.
`,
          elements: [],
          viewMode: 'canvas',
          canvasTheme: 'dark',
          gridVisible: true,
          gridSnap: true,
          version: 1,
        });
        await this.docRepo.save(fileC);

        this.logger.log('Demo project and files seeded successfully.');
      }
    } catch (e: any) {
      this.logger.error(`Seed project error: ${e.message}`);
    }
  }

  // --- Permissions Helper ---
  async getUserRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) return null;
    if (project.ownerId === userId) return 'owner';

    const member = await this.memberRepo.findOne({ where: { projectId, userId } });
    return member ? member.role : null;
  }

  // --- Project CRUD ---

  async getUserProjects(userId: string): Promise<Project[]> {
    // 1. Owned projects
    const owned = await this.projectRepo.find({
      where: { ownerId: userId },
      relations: { members: true, files: true },
      order: { updatedAt: 'DESC' },
    });

    // 2. Member projects
    const memberRecords = await this.memberRepo.find({
      where: { userId },
      relations: { project: { members: true, files: true } },
    });

    const projectMap = new Map<string, Project>();

    for (const p of owned) {
      const files = await this.docRepo.find({
        where: { projectId: p.id },
        relations: { elements: true },
        order: { createdAt: 'ASC' },
      });

      projectMap.set(p.id, {
        id: p.id,
        name: p.name,
        description: p.description,
        ownerId: p.ownerId,
        ownerName: p.ownerName,
        userRole: 'owner',
        members: (p.members || []).map((m) => ({
          id: m.id,
          projectId: m.projectId,
          userId: m.userId,
          userEmail: m.userEmail,
          userName: m.userName,
          role: m.role,
          createdAt: m.createdAt.toISOString(),
        })),
        files: files.map((f) => ({
          ...f,
          elements: (f.elements || []).map((el) => ({ ...el, updatedAt: Number(el.updatedAt) || Date.now() })),
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        })) as unknown as WhiteboardDocument[],
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      });
    }

    for (const mr of memberRecords) {
      if (mr.project && !projectMap.has(mr.project.id)) {
        const p = mr.project;
        const files = await this.docRepo.find({
          where: { projectId: p.id },
          relations: { elements: true },
          order: { createdAt: 'ASC' },
        });

        projectMap.set(p.id, {
          id: p.id,
          name: p.name,
          description: p.description,
          ownerId: p.ownerId,
          ownerName: p.ownerName,
          userRole: mr.role,
          members: (p.members || []).map((m) => ({
            id: m.id,
            projectId: m.projectId,
            userId: m.userId,
            userEmail: m.userEmail,
            userName: m.userName,
            role: m.role,
            createdAt: m.createdAt.toISOString(),
          })),
          files: files.map((f) => ({
            ...f,
            elements: (f.elements || []).map((el) => ({ ...el, updatedAt: Number(el.updatedAt) || Date.now() })),
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
          })) as unknown as WhiteboardDocument[],
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        });
      }
    }

    return Array.from(projectMap.values());
  }

  async getProjectById(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: { members: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    const role = await this.getUserRole(projectId, userId);
    if (!role) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const files = await this.docRepo.find({
      where: { projectId },
      relations: { elements: true },
      order: { createdAt: 'ASC' },
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      ownerName: project.ownerName,
      userRole: role,
      members: (project.members || []).map((m) => ({
        id: m.id,
        projectId: m.projectId,
        userId: m.userId,
        userEmail: m.userEmail,
        userName: m.userName,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
      })),
      files: files.map((f) => ({
        ...f,
        elements: (f.elements || []).map((el) => ({ ...el, updatedAt: Number(el.updatedAt) || Date.now() })),
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })) as unknown as WhiteboardDocument[],
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  async createProject(name: string, description: string, user: User): Promise<Project> {
    const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const project = this.projectRepo.create({
      id,
      name,
      description: description || '',
      ownerId: user.id,
      ownerName: user.name,
    });
    await this.projectRepo.save(project);

    // Add owner as member
    const ownerMember = this.memberRepo.create({
      id: `mem-${Date.now()}`,
      projectId: id,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      role: 'owner',
    });
    await this.memberRepo.save(ownerMember);

    // Create default initial file
    const initialDoc = this.docRepo.create({
      id: `doc-${Date.now()}`,
      projectId: id,
      title: 'File A: Main Canvas',
      description: 'Initial canvas file',
      notes: `# ${name}\n\nProject workspace initialized.`,
      elements: [],
      viewMode: 'split',
      canvasTheme: 'dark',
      gridVisible: true,
      gridSnap: true,
      version: 1,
    });
    await this.docRepo.save(initialDoc);

    return this.getProjectById(id, user.id);
  }

  async deleteProject(projectId: string, userId: string): Promise<{ success: boolean }> {
    const role = await this.getUserRole(projectId, userId);
    if (role !== 'owner') {
      throw new ForbiddenException('Only the project owner can delete the project');
    }
    await this.projectRepo.delete(projectId);
    return { success: true };
  }

  // --- Sharing & Permissions Management ---

  async addMember(
    projectId: string,
    email: string,
    role: ProjectRole,
    currentUserId: string
  ): Promise<ProjectMember> {
    const currentRole = await this.getUserRole(projectId, currentUserId);
    if (currentRole !== 'owner') {
      throw new ForbiddenException('Only project owners can invite and change member roles');
    }

    if (role === 'owner') {
      throw new BadRequestException('Cannot assign owner role via invite');
    }

    const targetUser = await this.authService.findByEmail(email);
    const userId = targetUser ? targetUser.id : `invited-${email}`;
    const userName = targetUser ? targetUser.name : email.split('@')[0];

    // Check if already a member
    let member = await this.memberRepo.findOne({
      where: { projectId, userEmail: email.toLowerCase() },
    });

    if (member) {
      member.role = role;
      member.userId = userId;
      member.userName = userName;
    } else {
      member = this.memberRepo.create({
        id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        userId,
        userEmail: email.toLowerCase(),
        userName,
        role,
      });
    }

    await this.memberRepo.save(member);

    return {
      id: member.id,
      projectId: member.projectId,
      userId: member.userId,
      userEmail: member.userEmail,
      userName: member.userName,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    };
  }

  async removeMember(projectId: string, memberId: string, currentUserId: string): Promise<{ success: boolean }> {
    const currentRole = await this.getUserRole(projectId, currentUserId);
    if (currentRole !== 'owner') {
      throw new ForbiddenException('Only project owners can remove members');
    }

    await this.memberRepo.delete({ id: memberId, projectId });
    return { success: true };
  }

  // --- Project Files Management ---

  async createFile(projectId: string, title: string, userId: string): Promise<WhiteboardDocument> {
    const role = await this.getUserRole(projectId, userId);
    if (!role || role === 'viewer') {
      throw new ForbiddenException('Viewers cannot create new files in this project');
    }

    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc = this.docRepo.create({
      id,
      projectId,
      title: title || 'New File',
      description: '',
      notes: `# ${title || 'New File'}\n\nStart writing notes...`,
      elements: [],
      viewMode: 'split',
      canvasTheme: 'dark',
      gridVisible: true,
      gridSnap: true,
      version: 1,
    });

    await this.docRepo.save(newDoc);

    return {
      ...newDoc,
      elements: [],
      createdAt: newDoc.createdAt.toISOString(),
      updatedAt: newDoc.updatedAt.toISOString(),
    };
  }

  async deleteFile(projectId: string, fileId: string, userId: string): Promise<{ success: boolean }> {
    const role = await this.getUserRole(projectId, userId);
    if (!role || role === 'viewer') {
      throw new ForbiddenException('Viewers cannot delete files');
    }

    // Ensure at least one file remains in project
    const count = await this.docRepo.count({ where: { projectId } });
    if (count <= 1) {
      throw new BadRequestException('A project must have at least one file');
    }

    await this.docRepo.delete({ id: fileId, projectId });
    return { success: true };
  }
}
