import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project, ProjectMember, ProjectRole, WhiteboardDocument, User } from '@rea/shared-types';
import { JwtAuthGuard, CurrentUser } from '../common';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    @Inject(ProjectService)
    private readonly projectService: ProjectService
  ) {}

  @Get()
  async getMyProjects(@CurrentUser() user: User): Promise<Project[]> {
    return this.projectService.getUserProjects(user.id);
  }

  @Post()
  async createProject(
    @CurrentUser() user: User,
    @Body() body: { name: string; description?: string; createInitialFile?: boolean }
  ): Promise<Project> {
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
    @CurrentUser() user: User
  ): Promise<Project> {
    return this.projectService.getProjectById(id, user.id);
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { name?: string; description?: string }
  ): Promise<Project> {
    return this.projectService.updateProject(id, body, user.id);
  }

  @Delete(':id')
  async deleteProject(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<{ success: boolean }> {
    return this.projectService.deleteProject(id, user.id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { email: string; role: ProjectRole }
  ): Promise<ProjectMember> {
    return this.projectService.addMember(id, body.email, body.role, user.id);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User
  ): Promise<{ success: boolean }> {
    return this.projectService.removeMember(id, memberId, user.id);
  }

  @Post(':id/files')
  async createFile(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { title: string }
  ): Promise<WhiteboardDocument> {
    return this.projectService.createFile(id, body.title, user.id);
  }

  @Delete(':id/files/:fileId')
  async deleteFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: User
  ): Promise<{ success: boolean }> {
    return this.projectService.deleteFile(id, fileId, user.id);
  }
}
