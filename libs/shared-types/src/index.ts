export type ElementType =
  | 'selection'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'draw'
  | 'text'
  | 'sticky'
  | 'image';

export type FillStyle = 'none' | 'solid' | 'hachure' | 'cross-hatch' | 'zigzag';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type TextAlign = 'left' | 'center' | 'right';
export type ArrowHead = 'none' | 'arrow' | 'triangle' | 'circle';

export interface Point {
  x: number;
  y: number;
}

export interface BoundElement {
  id: string;
  type: 'arrow' | 'text';
}

export interface ArrowBinding {
  elementId: string;
  focus: number;
  gap?: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  groupIds?: string[];
  boundElements?: BoundElement[] | null;
  updatedAt: number;

  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: TextAlign;
  textColor?: string;
  points?: Point[];
  startBinding?: ArrowBinding | null;
  endBinding?: ArrowBinding | null;
  startArrowhead?: ArrowHead | null;
  endArrowhead?: ArrowHead | null;
  zIndex?: number;
  locked?: boolean;
  customData?: Record<string, any>;
}

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StoredAccount {
  user: User;
  token: string;
  lastActive: number;
}

export interface UpdateProfileDto {
  name?: string;
  color?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: ProjectRole;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName?: string;
  userRole?: ProjectRole;
  members?: ProjectMember[];
  files?: WhiteboardDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardDocument {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  notes: string;
  elements: CanvasElement[];
  viewMode: 'canvas' | 'split' | 'notes';
  canvasTheme: 'light' | 'dark';
  gridVisible: boolean;
  gridSnap: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  color: string;
  role?: ProjectRole;
  cursor: Point | null;
  selectedElementIds: string[];
  activeView?: 'canvas' | 'notes';
  lastActive: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface AddProjectMemberDto {
  email: string;
  role: ProjectRole;
}

export interface CreateDocumentDto {
  projectId?: string;
  title: string;
  description?: string;
  notes?: string;
  elements?: CanvasElement[];
}

export interface UpdateDocumentDto {
  title?: string;
  description?: string;
  notes?: string;
  elements?: CanvasElement[];
  viewMode?: 'canvas' | 'split' | 'notes';
  canvasTheme?: 'light' | 'dark';
  gridVisible?: boolean;
  gridSnap?: boolean;
}

export interface DocumentExportData {
  version: number;
  source: 'sailboard' | 'eraser-excalidraw-clone';
  timestamp: number;
  document: WhiteboardDocument;
}
