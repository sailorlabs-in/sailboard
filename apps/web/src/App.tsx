import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import {
  CanvasElement,
  ElementType,
  Point,
  UserPresence,
  WhiteboardDocument,
  Project,
  ProjectRole,
} from '@rea/shared-types';
import { getAppTheme } from './theme/theme';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { NotesEditor } from './components/NotesEditor';
import { Canvas } from './components/Canvas';
import { Minimap } from './components/Minimap';
import { ExportDialog } from './components/ExportDialog';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ShareDialog } from './components/ShareDialog';
import { AuthDialog } from './components/AuthDialog';
import { ViewerNoticeBanner } from './components/ViewerNoticeBanner';
import { api } from './services/api';
import { socketService } from './services/socket';
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { user, token, isAuthenticated, loginAsDemo } = useAuth();

  // Theme & Layout State
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [viewMode, setViewMode] = useState<'canvas' | 'split' | 'notes'>('split');
  const [styleMode, setStyleMode] = useState<'rough' | 'clean'>('rough');
  const [splitWidth, setSplitWidth] = useState<number>(440);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Project & Multi-File State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole>('editor');

  // Modals
  const [shareOpen, setShareOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Document State
  const [doc, setDoc] = useState<WhiteboardDocument>({
    id: 'doc-welcome-sample',
    projectId: 'proj-sailboard-demo',
    title: 'File A: System Architecture',
    description: '',
    notes: `# Engineering System Architecture\n\nLoading workspace...`,
    elements: [],
    viewMode: 'split',
    canvasTheme: 'dark',
    gridVisible: true,
    gridSnap: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'synced'>('synced');

  // Canvas Viewport State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 60 });
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [gridSnap, setGridSnap] = useState<boolean>(true);
  const [gridType, setGridType] = useState<'dots' | 'grid' | 'blank'>('dots');

  // Tools & Selection
  const [activeTool, setActiveTool] = useState<ElementType | 'eraser' | 'pan'>('selection');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);

  // Style Defaults for new elements
  const [currentStyle, setCurrentStyle] = useState({
    strokeColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    fillStyle: 'hachure' as const,
    strokeWidth: 2,
    strokeStyle: 'solid' as const,
    roughness: 1.2,
    opacity: 100,
    fontSize: 16,
  });

  // Undo / Redo History
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Multiplayer Presence
  const [remoteUsers, setRemoteUsers] = useState<UserPresence[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const isViewer = userRole === 'viewer';

  // Determine user's role on project
  const computeRoleForProject = useCallback(
    (project: Project | null): ProjectRole => {
      if (!project) return 'editor';
      if (user && project.ownerId === user.id) return 'owner';
      if (project.userRole) return project.userRole;

      if (user && project.members) {
        const mem = project.members.find(
          (m) => m.userId === user.id || m.userEmail.toLowerCase() === user.email.toLowerCase()
        );
        if (mem) return mem.role;
      }
      return 'editor';
    },
    [user]
  );

  // Load Projects and Initial Active File
  const loadProjects = useCallback(async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);

      if (list.length > 0) {
        // Select first project or maintain current
        const targetProj = currentProject
          ? list.find((p) => p.id === currentProject.id) || list[0]
          : list[0];

        // Fetch full project with files
        const fullProj = await api.getProject(targetProj.id);
        setCurrentProject(fullProj);

        const role = computeRoleForProject(fullProj);
        setUserRole(role);

        // Select first file if available
        if (fullProj.files && fullProj.files.length > 0) {
          const targetFile =
            fullProj.files.find((f) => f.id === doc.id) || fullProj.files[0];
          setDoc(targetFile);
          setHistory([targetFile.elements]);
          setHistoryIndex(0);

          // Join WebSocket room
          if (user) {
            socketService.joinDocument(
              targetFile.id,
              { id: user.id, name: user.name, color: user.color },
              role
            );
          }
        }
      }
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') {
        // Auto-login Alice for instant demo convenience
        await loginAsDemo('alice').catch(console.error);
      } else {
        console.warn('Could not load projects:', err);
      }
    }
  }, [user, computeRoleForProject, loginAsDemo, currentProject, doc.id]);

  useEffect(() => {
    loadProjects();
  }, [token, user?.id]);

  // Setup WebSocket Listeners for real-time multiplayer sync
  useEffect(() => {
    const cleanupUsers = socketService.onUsersUpdate((users) => {
      if (user) {
        setRemoteUsers(users.filter((u) => u.userId !== user.id));
      } else {
        setRemoteUsers(users);
      }
    });

    const cleanupCursor = socketService.onCursorUpdate((presence) => {
      setRemoteUsers((prev) =>
        prev.map((u) => (u.userId === presence.userId ? presence : u))
      );
    });

    // Real-time live canvas sync: when User A modifies elements, User B sees it immediately!
    const cleanupElements = socketService.onElementsUpdate((remoteElements) => {
      setDoc((prev) => ({ ...prev, elements: remoteElements }));
    });

    // Real-time live notes sync
    const cleanupNote = socketService.onNoteUpdate((remoteNotes) => {
      setDoc((prev) => ({ ...prev, notes: remoteNotes }));
    });

    return () => {
      cleanupUsers();
      cleanupCursor();
      cleanupElements();
      cleanupNote();
      socketService.disconnect();
    };
  }, [user]);

  // Switch Active File inside current Project Folder
  const handleSelectFile = useCallback(
    (file: WhiteboardDocument) => {
      setDoc(file);
      setSelectedElementIds([]);
      setHistory([file.elements]);
      setHistoryIndex(0);

      if (user) {
        socketService.joinDocument(
          file.id,
          { id: user.id, name: user.name, color: user.color },
          userRole
        );
      }
    },
    [user, userRole]
  );

  // Switch Active Project Folder
  const handleSelectProject = useCallback(
    async (projectId: string) => {
      try {
        const fullProj = await api.getProject(projectId);
        setCurrentProject(fullProj);
        const role = computeRoleForProject(fullProj);
        setUserRole(role);

        if (fullProj.files && fullProj.files.length > 0) {
          handleSelectFile(fullProj.files[0]);
        }
      } catch (err) {
        console.error('Failed to select project:', err);
      }
    },
    [computeRoleForProject, handleSelectFile]
  );

  // Create New File in current Project Folder
  const handleCreateFile = async (title: string) => {
    if (!currentProject) return;
    try {
      const newFile = await api.createProjectFile(currentProject.id, title);
      const updatedProj = await api.getProject(currentProject.id);
      setCurrentProject(updatedProj);
      handleSelectFile(newFile);
    } catch (err: any) {
      alert(err.message || 'Failed to create file');
    }
  };

  // Delete File from current Project Folder
  const handleDeleteFile = async (fileId: string) => {
    if (!currentProject) return;
    try {
      await api.deleteProjectFile(currentProject.id, fileId);
      const updatedProj = await api.getProject(currentProject.id);
      setCurrentProject(updatedProj);
      if (doc.id === fileId && updatedProj.files && updatedProj.files.length > 0) {
        handleSelectFile(updatedProj.files[0]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  // Create New Project Folder
  const handleCreateProject = async (name: string, description?: string) => {
    try {
      const newProj = await api.createProject(name, description);
      await loadProjects();
      handleSelectProject(newProj.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  // Update Elements (Editor action) & Broadcast Live to Other Users
  const handleElementsChange = useCallback(
    (newElements: CanvasElement[], recordHistory = true) => {
      if (isViewer) return; // Viewers cannot edit

      setDoc((prev) => ({ ...prev, elements: newElements }));

      // Broadcast live to WebSockets & Redis Pub/Sub (User B receives this in real time!)
      socketService.emitElementsChange(newElements);

      if (recordHistory) {
        setHistory((prev) => {
          const next = prev.slice(0, historyIndex + 1);
          return [...next, newElements].slice(-50);
        });
        setHistoryIndex((prev) => prev + 1);

        // Auto-persist to PostgreSQL
        setSaveStatus('saving');
        api
          .syncElements(doc.id, newElements)
          .then(() => setSaveStatus('synced'))
          .catch(() => setSaveStatus('synced'));
      }
    },
    [doc.id, historyIndex, isViewer]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (isViewer) return;
    if (historyIndex > 0) {
      const prevElements = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      setDoc((prev) => ({ ...prev, elements: prevElements }));
      socketService.emitElementsChange(prevElements);
      api.syncElements(doc.id, prevElements).catch(console.error);
    }
  }, [doc.id, history, historyIndex, isViewer]);

  const handleRedo = useCallback(() => {
    if (isViewer) return;
    if (historyIndex < history.length - 1) {
      const nextElements = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      setDoc((prev) => ({ ...prev, elements: nextElements }));
      socketService.emitElementsChange(nextElements);
      api.syncElements(doc.id, nextElements).catch(console.error);
    }
  }, [doc.id, history, historyIndex, isViewer]);

  // Notes update (Editor action) & Live Broadcast
  const handleNotesChange = (newNotes: string) => {
    if (isViewer) return;
    setDoc((prev) => ({ ...prev, notes: newNotes }));
    socketService.emitNoteChange(newNotes);
    api.updateDocument(doc.id, { notes: newNotes }).catch(console.error);
  };

  // Title update
  const handleTitleChange = (newTitle: string) => {
    if (isViewer) return;
    setDoc((prev) => ({ ...prev, title: newTitle }));
    api.updateDocument(doc.id, { title: newTitle }).catch(console.error);
    if (currentProject) {
      setCurrentProject((prev) =>
        prev
          ? {
              ...prev,
              files: prev.files?.map((f) => (f.id === doc.id ? { ...f, title: newTitle } : f)),
            }
          : null
      );
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isViewer) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      // Tool shortcuts
      const key = e.key.toUpperCase();
      switch (key) {
        case 'V':
        case '1':
          setActiveTool('selection');
          break;
        case 'H':
          setActiveTool('pan');
          break;
        case 'R':
        case '2':
          setActiveTool('rectangle');
          break;
        case 'D':
        case '3':
          setActiveTool('diamond');
          break;
        case 'O':
        case '4':
          setActiveTool('ellipse');
          break;
        case 'A':
        case '5':
          setActiveTool('arrow');
          break;
        case 'L':
        case '6':
          setActiveTool('line');
          break;
        case 'P':
        case '7':
          setActiveTool('draw');
          break;
        case 'T':
        case '8':
          setActiveTool('text');
          break;
        case 'S':
        case '9':
          setActiveTool('sticky');
          break;
        case 'E':
        case '0':
          setActiveTool('eraser');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, handleUndo, handleRedo, isViewer]);

  // Element Actions (Duplicate, Delete, Reorder)
  const handleDuplicate = () => {
    if (isViewer || selectedElementIds.length === 0) return;
    const offset = 24;
    const duplicated: CanvasElement[] = [];
    const newSelectedIds: string[] = [];

    doc.elements.forEach((el) => {
      if (selectedElementIds.includes(el.id)) {
        const newId = `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        newSelectedIds.push(newId);
        duplicated.push({
          ...el,
          id: newId,
          x: el.x + offset,
          y: el.y + offset,
          seed: Math.floor(Math.random() * 100000),
          version: 1,
          updatedAt: Date.now(),
        });
      }
    });

    handleElementsChange([...doc.elements, ...duplicated]);
    setSelectedElementIds(newSelectedIds);
  };

  const handleDeleteSelected = () => {
    if (isViewer || selectedElementIds.length === 0) return;
    const updated = doc.elements.map((el) =>
      selectedElementIds.includes(el.id) ? { ...el, isDeleted: true } : el
    );
    handleElementsChange(updated);
    setSelectedElementIds([]);
  };

  const handleBringToFront = () => {
    if (isViewer || selectedElementIds.length === 0) return;
    const selected = doc.elements.filter((el) => selectedElementIds.includes(el.id));
    const others = doc.elements.filter((el) => !selectedElementIds.includes(el.id));
    handleElementsChange([...others, ...selected]);
  };

  const handleSendToBack = () => {
    if (isViewer || selectedElementIds.length === 0) return;
    const selected = doc.elements.filter((el) => selectedElementIds.includes(el.id));
    const others = doc.elements.filter((el) => !selectedElementIds.includes(el.id));
    handleElementsChange([...selected, ...others]);
  };

  const handleUpdateStyle = (updates: Partial<CanvasElement>) => {
    if (isViewer) return;
    setCurrentStyle((prev) => ({ ...prev, ...(updates as any) }));

    if (selectedElementIds.length > 0) {
      const updated = doc.elements.map((el) => {
        if (selectedElementIds.includes(el.id)) {
          return {
            ...el,
            ...updates,
            version: el.version + 1,
            updatedAt: Date.now(),
          };
        }
        return el;
      });
      handleElementsChange(updated);
    }
  };

  // Convert Doc Notes to Architecture Flowchart Shapes
  const handleGenerateDiagramFromNotes = (markdownText: string) => {
    if (isViewer) return;
    const lines = markdownText.split('\n');
    const nodes: string[] = [];

    lines.forEach((line) => {
      const clean = line.trim();
      if (clean.startsWith('#') || clean.startsWith('-') || clean.startsWith('*')) {
        const text = clean.replace(/^[#\-*\s]+/, '').replace(/\[[ xX]\]/, '').trim();
        if (text && text.length > 1 && text.length < 50) {
          nodes.push(text);
        }
      }
    });

    if (nodes.length === 0) {
      nodes.push('Architecture Step 1', 'API Processing', 'Redis Cache', 'Storage');
    }

    const generatedElements: CanvasElement[] = [];
    const startX = 140;
    const startY = 180;
    const nodeWidth = 190;
    const nodeHeight = 85;
    const gapX = 90;

    nodes.slice(0, 7).forEach((nodeText, i) => {
      const x = startX + i * (nodeWidth + gapX);
      const y = startY + (i % 2 === 1 ? 50 : 0);
      const isDecision = nodeText.toLowerCase().includes('gateway') || nodeText.toLowerCase().includes('decision');
      const isCache = nodeText.toLowerCase().includes('cache') || nodeText.toLowerCase().includes('redis');

      const shapeType: ElementType = isDecision ? 'diamond' : isCache ? 'ellipse' : 'rectangle';
      const shapeId = `gen-${Date.now()}-${i}`;

      generatedElements.push({
        id: shapeId,
        type: shapeType,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
        angle: 0,
        strokeColor: isDecision ? '#10b981' : isCache ? '#f59e0b' : '#6366f1',
        backgroundColor: isDecision
          ? 'rgba(16, 185, 129, 0.15)'
          : isCache
          ? 'rgba(245, 158, 11, 0.15)'
          : 'rgba(99, 102, 241, 0.15)',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: styleMode === 'rough' ? 1.2 : 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        text: nodeText,
        fontSize: 14,
        textAlign: 'center',
      });

      // Connector arrow to previous node
      if (i > 0) {
        const prevShape = generatedElements[generatedElements.length - 2];
        const arrowId = `gen-arrow-${Date.now()}-${i}`;
        const arrowStartX = prevShape.x + prevShape.width;
        const arrowStartY = prevShape.y + prevShape.height / 2;
        const arrowEndX = x;
        const arrowEndY = y + nodeHeight / 2;

        generatedElements.push({
          id: arrowId,
          type: 'arrow',
          x: arrowStartX,
          y: arrowStartY,
          width: arrowEndX - arrowStartX,
          height: arrowEndY - arrowStartY,
          angle: 0,
          strokeColor: '#94a3b8',
          backgroundColor: 'transparent',
          fillStyle: 'none',
          strokeWidth: 2,
          strokeStyle: 'solid',
          roughness: styleMode === 'rough' ? 1 : 0,
          opacity: 100,
          seed: Math.floor(Math.random() * 100000),
          version: 1,
          versionNonce: 1,
          isDeleted: false,
          updatedAt: Date.now(),
          points: [
            { x: 0, y: 0 },
            { x: arrowEndX - arrowStartX, y: arrowEndY - arrowStartY },
          ],
          endArrowhead: 'arrow',
        });
      }
    });

    handleElementsChange([...doc.elements, ...generatedElements]);
  };

  // Zoom Helpers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.2));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 60, y: 60 });
  };
  const handleZoomToFit = () => {
    const active = doc.elements.filter((el) => !el.isDeleted);
    if (active.length === 0) return handleZoomReset();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    active.forEach((el) => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    const w = canvasContainerRef.current?.clientWidth || 800;
    const h = canvasContainerRef.current?.clientHeight || 600;
    const boundingW = maxX - minX + 160;
    const boundingH = maxY - minY + 160;

    const fitZoom = Math.min(w / boundingW, h / boundingH, 1.5);
    setZoom(fitZoom);
    setPan({
      x: (w - (maxX - minX) * fitZoom) / 2 - minX * fitZoom,
      y: (h - (maxY - minY) * fitZoom) / 2 - minY * fitZoom,
    });
  };

  // Import JSON File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.elements && Array.isArray(parsed.elements)) {
          handleElementsChange(parsed.elements);
        } else if (parsed.document && parsed.document.elements) {
          handleElementsChange(parsed.document.elements);
          if (parsed.document.notes) setDoc((prev) => ({ ...prev, notes: parsed.document.notes }));
        }
      } catch (err) {
        alert('Invalid JSON whiteboard file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Split-screen drag handling
  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(moveEvent.clientX - (sidebarOpen ? 280 : 56), window.innerWidth - 380));
      setSplitWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const selectedElements = doc.elements.filter((el) => selectedElementIds.includes(el.id) && !el.isDeleted);
  const theme = getAppTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Hidden File Input for Import */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json,.excalidraw"
          onChange={handleImportFile}
        />

        {/* Global Navigation Header */}
        <Header
          projectName={currentProject?.name || 'Sailboard Project'}
          userRole={userRole}
          title={doc.title}
          onTitleChange={handleTitleChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          styleMode={styleMode}
          onStyleModeChange={setStyleMode}
          theme={themeMode}
          onThemeToggle={() => setThemeMode((m) => (m === 'light' ? 'dark' : 'light'))}
          gridVisible={gridVisible}
          onGridVisibleToggle={() => setGridVisible((v) => !v)}
          gridSnap={gridSnap}
          onGridSnapToggle={() => setGridSnap((s) => !s)}
          gridType={gridType}
          onGridTypeChange={setGridType}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onZoomToFit={handleZoomToFit}
          onExportClick={() => setExportOpen(true)}
          onImportClick={() => fileInputRef.current?.click()}
          remoteUsers={remoteUsers}
          saveStatus={saveStatus}
          onOpenShare={() => setShareOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          currentUser={user}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        {/* Viewer Mode Alert Banner */}
        {isViewer && (
          <ViewerNoticeBanner
            ownerName={currentProject?.ownerName || 'Project Owner'}
            onOpenShare={() => setShareOpen(true)}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {/* Workspace Body: Sidebar + Editor/Canvas Area */}
        <Box sx={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 52px)', position: 'relative', overflow: 'hidden' }}>
          {/* Project & Multi-File Explorer Drawer */}
          <ProjectSidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
            projects={projects}
            currentProject={currentProject}
            currentFile={doc}
            onSelectProject={handleSelectProject}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onCreateProject={handleCreateProject}
            onOpenShare={() => setShareOpen(true)}
            onOpenAuth={() => setAuthOpen(true)}
            userRole={userRole}
          />

          {/* Left Split: Eraser-Style Markdown Documentation */}
          {(viewMode === 'split' || viewMode === 'notes') && (
            <Box
              sx={{
                width: viewMode === 'notes' ? '100%' : `${splitWidth}px`,
                height: '100%',
                bgcolor: 'background.paper',
                borderRight: viewMode === 'split' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <NotesEditor
                notes={doc.notes}
                onChange={handleNotesChange}
                onGenerateDiagramFromNotes={handleGenerateDiagramFromNotes}
                theme={themeMode}
                isViewer={isViewer}
              />
            </Box>
          )}

          {/* Resizable Divider Handle between Docs and Canvas */}
          {viewMode === 'split' && (
            <Box
              onMouseDown={handleSplitMouseDown}
              sx={{
                width: 6,
                cursor: 'col-resize',
                bgcolor: isDraggingSplit ? 'primary.main' : 'transparent',
                zIndex: 35,
                transition: 'background-color 0.15s ease',
                '&:hover': { bgcolor: 'primary.main' },
              }}
            />
          )}

          {/* Right Split: Excalidraw-Style Infinite Canvas */}
          {(viewMode === 'split' || viewMode === 'canvas') && (
            <Box
              ref={canvasContainerRef}
              sx={{
                flexGrow: 1,
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Floating Toolbar */}
              <Toolbar
                activeTool={activeTool}
                onToolSelect={setActiveTool}
                theme={themeMode}
                isViewer={isViewer}
              />

              {/* Floating Properties Inspector (Hidden for Viewers) */}
              {!isViewer && (
                <PropertiesPanel
                  selectedElements={selectedElements}
                  currentStyle={currentStyle}
                  onUpdateStyle={handleUpdateStyle}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDeleteSelected}
                  onBringToFront={handleBringToFront}
                  onSendToBack={handleSendToBack}
                  theme={themeMode}
                />
              )}

              {/* Main Canvas Component */}
              <Canvas
                elements={doc.elements}
                onElementsChange={handleElementsChange}
                selectedElementIds={selectedElementIds}
                onSelectElements={setSelectedElementIds}
                activeTool={activeTool}
                onToolChange={setActiveTool}
                theme={themeMode}
                styleMode={styleMode}
                gridVisible={gridVisible}
                gridSnap={gridSnap}
                gridType={gridType}
                zoom={zoom}
                onZoomChange={setZoom}
                pan={pan}
                onPanChange={setPan}
                currentStyle={currentStyle}
                remoteUsers={remoteUsers}
                onCursorMove={(cursor) => socketService.emitCursorMove(cursor)}
                isViewer={isViewer}
              />

              {/* Bottom Right Minimap */}
              <Minimap
                elements={doc.elements}
                zoom={zoom}
                pan={pan}
                containerWidth={canvasContainerRef.current?.clientWidth || 800}
                containerHeight={canvasContainerRef.current?.clientHeight || 600}
                onNavigate={setPan}
                theme={themeMode}
              />
            </Box>
          )}
        </Box>

        {/* Share & Permissions Dialog */}
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          project={currentProject}
          onProjectUpdated={(p) => {
            setCurrentProject(p);
            const role = computeRoleForProject(p);
            setUserRole(role);
          }}
        />

        {/* Auth & Account Switcher Dialog */}
        <AuthDialog
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => loadProjects()}
        />

        {/* Export Modal */}
        <ExportDialog
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          document={doc}
          theme={themeMode}
          styleMode={styleMode}
        />
      </Box>
    </ThemeProvider>
  );
};
