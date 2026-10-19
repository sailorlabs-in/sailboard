import {
  WhiteboardDocument,
  CreateDocumentDto,
  UpdateDocumentDto,
  CanvasElement,
  DocumentExportData,
  Project,
  ProjectMember,
  ProjectRole,
  AuthResponse,
  User,
} from '@rea/shared-types';
import { axiosClient } from './axiosClient';

class ApiService {
  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('sailboard_token', token);
    } else {
      localStorage.removeItem('sailboard_token');
    }
  }

  getToken(): string | null {
    return localStorage.getItem('sailboard_token');
  }

  // --- Auth APIs ---

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await axiosClient.post<AuthResponse>('/auth/login', { email, password });
    this.setToken(res.data.token);
    return res.data;
  }

  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    const res = await axiosClient.post<AuthResponse>('/auth/register', { email, name, password });
    this.setToken(res.data.token);
    return res.data;
  }

  async getMe(): Promise<User> {
    const res = await axiosClient.get<User>('/auth/me');
    return res.data;
  }

  // --- Project APIs ---

  async getProjects(): Promise<Project[]> {
    const res = await axiosClient.get<Project[]>('/projects');
    return res.data;
  }

  async getProject(id: string): Promise<Project> {
    const res = await axiosClient.get<Project>(`/projects/${id}`);
    return res.data;
  }

  async createProject(name: string, description?: string, createInitialFile = false): Promise<Project> {
    const res = await axiosClient.post<Project>('/projects', { name, description, createInitialFile });
    return res.data;
  }

  async deleteProject(id: string): Promise<boolean> {
    const res = await axiosClient.delete(`/projects/${id}`);
    return res.status === 200 || res.status === 204;
  }

  // --- Member & Role APIs ---

  async addProjectMember(
    projectId: string,
    email: string,
    role: ProjectRole
  ): Promise<ProjectMember> {
    const res = await axiosClient.post<ProjectMember>(`/projects/${projectId}/members`, { email, role });
    return res.data;
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<boolean> {
    const res = await axiosClient.delete(`/projects/${projectId}/members/${memberId}`);
    return res.status === 200 || res.status === 204;
  }

  // --- Project Files APIs ---

  async createProjectFile(projectId: string, title: string): Promise<WhiteboardDocument> {
    const res = await axiosClient.post<WhiteboardDocument>(`/projects/${projectId}/files`, { title });
    return res.data;
  }

  async deleteProjectFile(projectId: string, fileId: string): Promise<boolean> {
    const res = await axiosClient.delete(`/projects/${projectId}/files/${fileId}`);
    return res.status === 200 || res.status === 204;
  }

  // --- Document APIs ---

  async getDocuments(): Promise<WhiteboardDocument[]> {
    const res = await axiosClient.get<WhiteboardDocument[]>('/documents');
    return res.data;
  }

  async getDocument(id: string): Promise<WhiteboardDocument> {
    const res = await axiosClient.get<WhiteboardDocument>(`/documents/${id}`);
    return res.data;
  }

  async updateDocument(id: string, dto: UpdateDocumentDto): Promise<WhiteboardDocument> {
    const res = await axiosClient.put<WhiteboardDocument>(`/documents/${id}`, dto);
    return res.data;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const res = await axiosClient.delete(`/documents/${id}`);
    return res.status === 200 || res.status === 204;
  }

  async syncElements(id: string, elements: CanvasElement[]): Promise<CanvasElement[]> {
    const res = await axiosClient.post<CanvasElement[]>(`/documents/${id}/elements`, { elements });
    return res.data;
  }

  async exportDocument(id: string): Promise<DocumentExportData> {
    const res = await axiosClient.get<DocumentExportData>(`/documents/${id}/export`);
    return res.data;
  }

  async importDocument(data: any): Promise<WhiteboardDocument> {
    const res = await axiosClient.post<WhiteboardDocument>('/documents/import', data);
    return res.data;
  }
}

export const api = new ApiService();
