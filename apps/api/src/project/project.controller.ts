import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthService } from '../auth/auth.service';
import { Project, ProjectMember, ProjectRole, WhiteboardDocument } from '@rea/shared-types';

@Controller('projects')
export class ProjectController {
  constructor(
    @Inject(ProjectService)
    private readonly projectService: ProjectService,
    @Inject(AuthService)
    private readonly authService: AuthService
  ) {}

  private async getAuthUser(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.verifyToken(token);
  }

  @Get()
  async getMyProjects(@Headers('authorization') authHeader?: string): Promise<Project[]> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.getUserProjects(user.id);
  }

  @Post()
  async createProject(
    @Body() body: { name: string; description?: string; createInitialFile?: boolean },
    @Headers('authorization') authHeader?: string
  ): Promise<Project> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.createProject(
      body.name,
      body.description || '',
      user,
      Boolean(body.createInitialFile)
    );
  }

  @Get(':id')
  async getProject(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ): Promise<Project> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.getProjectById(id, user.id);
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
    @Headers('authorization') authHeader?: string
  ): Promise<Project> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.updateProject(id, body, user.id);
  }

  @Delete(':id')
  async deleteProject(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ): Promise<{ success: boolean }> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.deleteProject(id, user.id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() body: { email: string; role: ProjectRole },
    @Headers('authorization') authHeader?: string
  ): Promise<ProjectMember> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.addMember(id, body.email, body.role, user.id);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Headers('authorization') authHeader?: string
  ): Promise<{ success: boolean }> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.removeMember(id, memberId, user.id);
  }

  @Post(':id/files')
  async createFile(
    @Param('id') id: string,
    @Body() body: { title: string },
    @Headers('authorization') authHeader?: string
  ): Promise<WhiteboardDocument> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.createFile(id, body.title, user.id);
  }

  @Delete(':id/files/:fileId')
  async deleteFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Headers('authorization') authHeader?: string
  ): Promise<{ success: boolean }> {
    const user = await this.getAuthUser(authHeader);
    return this.projectService.deleteFile(id, fileId, user.id);
  }
}
