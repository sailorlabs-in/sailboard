import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
export class ProjectService {
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

  async createProject(
    name: string,
    description: string,
    user: User,
    createInitialFile = false
  ): Promise<Project> {
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

    // Create default initial file only if requested
    if (createInitialFile) {
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
    }

    return this.getProjectById(id, user.id);
  }

  async updateProject(
    projectId: string,
    updates: { name?: string; description?: string },
    userId: string
  ): Promise<Project> {
    const role = await this.getUserRole(projectId, userId);
    if (role !== 'owner' && role !== 'editor') {
      throw new ForbiddenException('You do not have permission to edit this project folder');
    }

    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project folder not found');

    if (updates.name !== undefined && updates.name.trim()) {
      project.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      project.description = updates.description.trim();
    }

    await this.projectRepo.save(project);
    return this.getProjectById(projectId, userId);
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

    await this.docRepo.delete({ id: fileId, projectId });
    return { success: true };
  }
}
