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

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('sailboard_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('sailboard_token', token);
    } else {
      localStorage.removeItem('sailboard_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('sailboard_token');
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    const t = this.getToken();
    if (t) {
      headers['Authorization'] = `Bearer ${t}`;
    }
    return headers;
  }

  // --- Auth APIs ---

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    const data: AuthResponse = await res.json();
    this.setToken(data.token);
    return data;
  }

  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    const data: AuthResponse = await res.json();
    this.setToken(data.token);
    return data;
  }

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get current user');
    return res.json();
  }

  // --- Project APIs ---

  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to fetch projects');
    }
    return res.json();
  }

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch project ${id}`);
    return res.json();
  }

  async createProject(name: string, description?: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  }

  async deleteProject(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  // --- Member & Role APIs ---

  async addProjectMember(
    projectId: string,
    email: string,
    role: ProjectRole
  ): Promise<ProjectMember> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to add member' }));
      throw new Error(err.message || 'Failed to add member');
    }
    return res.json();
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  // --- Project Files APIs ---

  async createProjectFile(projectId: string, title: string): Promise<WhiteboardDocument> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create file' }));
      throw new Error(err.message || 'Failed to create file');
    }
    return res.json();
  }

  async deleteProjectFile(projectId: string, fileId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete file' }));
      throw new Error(err.message || 'Failed to delete file');
    }
    return res.ok;
  }

  // --- Document APIs ---

  async getDocuments(): Promise<WhiteboardDocument[]> {
    const res = await fetch(`${API_BASE}/documents`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  }

  async getDocument(id: string): Promise<WhiteboardDocument> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch document ${id}`);
    return res.json();
  }

  async updateDocument(id: string, dto: UpdateDocumentDto): Promise<WhiteboardDocument> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  }

  async deleteDocument(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  async syncElements(id: string, elements: CanvasElement[]): Promise<CanvasElement[]> {
    const res = await fetch(`${API_BASE}/documents/${id}/elements`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ elements }),
    });
    if (!res.ok) throw new Error('Failed to sync elements');
    return res.json();
  }

  async exportDocument(id: string): Promise<DocumentExportData> {
    const res = await fetch(`${API_BASE}/documents/${id}/export`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export document');
    return res.json();
  }

  async importDocument(data: any): Promise<WhiteboardDocument> {
    const res = await fetch(`${API_BASE}/documents/import`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to import document');
    return res.json();
  }
}

export const api = new ApiService();
