import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Button,
  CircularProgress,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  CanvasElement,
  ElementType,
  UserPresence,
  WhiteboardDocument,
  Project,
  ProjectRole,
  CanvasComment,
  Point,
} from "@rea/shared-types";
import toast, { Toaster } from "react-hot-toast";
import { SailingOutlined } from "@mui/icons-material";
import gsap from "gsap";
import { ThemePreference, getAppTheme } from "./theme/theme";
import { Header } from "./components/Header";
import { Toolbar } from "./components/Toolbar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { NotesEditor } from "./components/NotesEditor";
import { Canvas } from "./components/Canvas";
import { Minimap } from "./components/Minimap";
import { ExportDialog } from "./components/ExportDialog";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ShareDialog } from "./components/ShareDialog";
import { ViewerNoticeBanner } from "./components/ViewerNoticeBanner";
import { AuthScreen } from "./components/AuthScreen";
import { AuthDialog } from "./components/AuthDialog";
import { AccountManageDialog } from "./components/AccountManageDialog";
import { DocToDiagramModal } from "./components/modals";
import { Dashboard } from "./components/Dashboard";
import { CommandPalette } from "./components/CommandPalette";
import { CanvasComments } from "./components/CanvasComments";
import { api } from "./services/api";
import { socketService } from "./services/socket";
import { useAuth } from "./context/AuthContext";
import {
  alignElements,
  distributeElements,
  flipElements,
  groupElements,
  ungroupElements,
} from "./canvas/math";

export function App() {
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Figma-Style URL Routing:
  // - Dashboard / Files View: / or /files or /dashboard or /project/:projectId
  // - Canvas File Editor: /file/:fileId or /project/:projectId/file/:fileId
  const fileRouteMatch =
    location.pathname.match(/^\/file\/([^/]+)/) ||
    location.pathname.match(/^\/project\/([^/]+)\/file\/([^/]+)/);
  const routeFileId = fileRouteMatch
    ? fileRouteMatch[2] || fileRouteMatch[1]
    : null;

  const projectRouteMatch = location.pathname.match(/^\/project\/([^/]+)$/);
  const routeProjectId = projectRouteMatch ? projectRouteMatch[1] : null;

  const isEditorRoute = Boolean(routeFileId);
  const currentView: "dashboard" | "editor" = isEditorRoute
    ? "editor"
    : "dashboard";
  const [isLoadingRouteFile, setIsLoadingRouteFile] = useState(false);
  const [routeFileError, setRouteFileError] = useState<string | null>(null);

  // Theme Preference State: 'light' | 'dark' | 'system' (Persisted in localStorage)
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    () => {
      try {
        const saved = localStorage.getItem("sailboard_theme_pref");
        if (saved === "light" || saved === "dark" || saved === "system")
          return saved;
        // Backwards compatibility with old key
        const oldMode = localStorage.getItem("sailboard_theme_mode");
        if (oldMode === "light" || oldMode === "dark") return oldMode;
      } catch {}
      return "system";
    },
  );

  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const effectiveThemeMode: "light" | "dark" =
    themePreference === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : themePreference;

  const theme = getAppTheme(effectiveThemeMode);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Account Management & Auth Dialog states
  const [accountManageOpen, setAccountManageOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"auth" | "add-account">(
    "auth",
  );

  // Layout State (Persisted in localStorage)
  const [viewMode, setViewMode] = useState<"canvas" | "split" | "notes">(() => {
    try {
      const saved = localStorage.getItem("sailboard_view_mode");
      if (saved === "canvas" || saved === "split" || saved === "notes")
        return saved;
    } catch {}
    return "canvas";
  });
  const [styleMode, setStyleMode] = useState<"rough" | "clean">(() => {
    try {
      const saved = localStorage.getItem("sailboard_style_mode");
      if (saved === "rough" || saved === "clean") return saved;
    } catch {}
    return "rough";
  });
  const [splitWidth, setSplitWidth] = useState<number>(440);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("sailboard_sidebar_open");
      if (saved !== null) return saved === "true";
    } catch {}
    return true;
  });

  // Project & Multi-File State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole>("editor");

  // Modals
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [docToDiagramOpen, setDocToDiagramOpen] = useState(false);

  // Document State
  const [doc, setDoc] = useState<WhiteboardDocument>({
    id: "",
    projectId: "",
    title: "Untitled Canvas",
    description: "",
    notes: "",
    elements: [],
    viewMode: "canvas",
    canvasTheme: "dark",
    gridVisible: true,
    gridSnap: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "synced">(
    "synced",
  );

  // Canvas Viewport State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 60 });
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [gridSnap, setGridSnap] = useState<boolean>(true);
  const [gridType, setGridType] = useState<"dots" | "grid" | "blank">("dots");

  // Tools & Selection
  const [activeTool, setActiveTool] = useState<
    ElementType | "eraser" | "pan" | "comment"
  >("selection");
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);

  // Figma-Style Canvas Comment Pins State
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<boolean>(true);
  const [pendingPinPos, setPendingPinPos] = useState<Point | null>(null);

  // Fast Command Palette State (⌘K / Ctrl+K)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Tool Lock (keep tool active after drawing)
  const [isToolLocked, setIsToolLocked] = useState<boolean>(false);
  const isToolLockedRef = useRef(isToolLocked);
  isToolLockedRef.current = isToolLocked;

  const handleToggleToolLock = useCallback(() => {
    const next = !isToolLockedRef.current;
    setIsToolLocked(next);
    toast(next ? "Tool Lock Enabled (stays selected)" : "Tool Lock Disabled", {
      id: "tool-lock-toast",
      icon: next ? "🔒" : "🔓",
      duration: 2000,
    });
  }, []);

  // Style Defaults for new elements
  const [currentStyle, setCurrentStyle] = useState({
    strokeColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    textColor: "contrast",
    fillStyle: "hachure" as const,
    strokeWidth: 2,
    strokeStyle: "solid" as const,
    roughness: 1.2,
    opacity: 100,
    fontSize: 16,
    fillOpacity: 15,
    roundness: "sharp" as const,
    fontFamily: "hand-drawn",
    textAlign: "center" as const,
    startArrowhead: "none" as const,
    endArrowhead: "arrow" as const,
  });

  // Undo / Redo History
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Persist Theme Preference & Synchronize data-theme for Neumorphic CSS
  useEffect(() => {
    try {
      localStorage.setItem("sailboard_theme_pref", themePreference);
    } catch {}
    document.documentElement.setAttribute("data-theme", effectiveThemeMode);
  }, [themePreference, effectiveThemeMode]);

  // Persist View Mode (Split, Canvas, Notes)
  useEffect(() => {
    try {
      localStorage.setItem("sailboard_view_mode", viewMode);
    } catch {}
  }, [viewMode]);

  // Persist Sidebar Expanded/Collapsed
  useEffect(() => {
    if (!isMobile) {
      try {
        localStorage.setItem("sailboard_sidebar_open", String(sidebarOpen));
      } catch {}
    }
  }, [sidebarOpen, isMobile]);

  // Persist Style Mode (Rough, Clean)
  useEffect(() => {
    try {
      localStorage.setItem("sailboard_style_mode", styleMode);
    } catch {}
  }, [styleMode]);

  // Dynamic Figma-Style Page Title (e.g. "Architecture – Sailboard" or "Projects & Files – Sailboard")
  useEffect(() => {
    if (isEditorRoute && doc?.title) {
      document.title = `${doc.title} – Sailboard`;
    } else {
      document.title = "Projects & Files – Sailboard";
    }
  }, [isEditorRoute, doc?.title]);

  // Sync sidebar state on screen size changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setViewMode((prev) => (prev === "split" ? "canvas" : prev));
    } else {
      try {
        const saved = localStorage.getItem("sailboard_sidebar_open");
        if (saved !== null) {
          setSidebarOpen(saved === "true");
        } else {
          setSidebarOpen(true);
        }
      } catch {
        setSidebarOpen(true);
      }
    }
  }, [isMobile]);

  // Multiplayer Presence
  const [remoteUsers, setRemoteUsers] = useState<UserPresence[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const notesPanelRef = useRef<HTMLDivElement | null>(null);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLayoutMount = useRef(true);

  // Seamless GSAP View Mode Layout Transition (Split <-> Canvas <-> Notes)
  useEffect(() => {
    const notesEl = notesPanelRef.current;
    const canvasEl = canvasContainerRef.current;
    const dividerEl = dividerRef.current;
    if (!notesEl || !canvasEl) return;

    if (viewMode === "canvas") {
      gsap.killTweensOf([notesEl, canvasEl, dividerEl]);
      gsap.to(notesEl, {
        width: 0,
        opacity: 0,
        duration: 0.28,
        ease: "power3.out",
        onComplete: () => {
          if (notesPanelRef.current) notesPanelRef.current.style.display = "none";
        },
      });
      if (dividerEl) {
        gsap.to(dividerEl, {
          width: 0,
          opacity: 0,
          duration: 0.2,
          ease: "power2.out",
          onComplete: () => {
            if (dividerRef.current) dividerRef.current.style.display = "none";
          },
        });
      }
      gsap.set(canvasEl, { display: "block" });
      gsap.to(canvasEl, { opacity: 1, duration: 0.28, ease: "power3.out" });
    } else if (viewMode === "split") {
      gsap.killTweensOf([notesEl, canvasEl, dividerEl]);
      gsap.set(notesEl, { display: "flex" });
      gsap.set(canvasEl, { display: "block" });
      if (dividerEl) gsap.set(dividerEl, { display: "block" });

      gsap.to(notesEl, {
        width: splitWidth,
        opacity: 1,
        duration: 0.32,
        ease: "power3.out",
      });
      if (dividerEl) {
        gsap.to(dividerEl, {
          width: 6,
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
        });
      }
      gsap.to(canvasEl, { opacity: 1, duration: 0.32, ease: "power3.out" });
    } else if (viewMode === "notes") {
      gsap.killTweensOf([notesEl, canvasEl, dividerEl]);
      gsap.set(notesEl, { display: "flex" });
      gsap.to(notesEl, {
        width: "100%",
        opacity: 1,
        duration: 0.32,
        ease: "power3.out",
      });
      if (dividerEl) {
        gsap.to(dividerEl, {
          width: 0,
          opacity: 0,
          duration: 0.2,
          ease: "power2.out",
          onComplete: () => {
            if (dividerRef.current) dividerRef.current.style.display = "none";
          },
        });
      }
      gsap.to(canvasEl, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          if (canvasContainerRef.current) canvasContainerRef.current.style.display = "none";
        },
      });
    }
  }, [viewMode, currentView, splitWidth]);

  // Synchronize width when user actively drags split resize handle
  useEffect(() => {
    if (viewMode === "split" && notesPanelRef.current && isDraggingSplit) {
      notesPanelRef.current.style.width = `${splitWidth}px`;
    }
  }, [splitWidth, viewMode, isDraggingSplit]);

  const isOwner = userRole === "owner";
  const isEditor = userRole === "editor";
  const isCommenter = userRole === "commenter";
  const canEdit = isOwner || isEditor;
  const canComment = isOwner || isEditor || isCommenter;
  const isViewer = !canEdit;

  // Determine user's role on project
  const computeRoleForProject = useCallback(
    (project: Project | null): ProjectRole => {
      if (!project) return "editor";
      if (user && project.ownerId === user.id) return "owner";
      if (project.userRole) return project.userRole;

      if (user && project.members) {
        const mem = project.members.find(
          (m) =>
            m.userId === user.id ||
            m.userEmail.toLowerCase() === user.email.toLowerCase(),
        );
        if (mem) return mem.role;
      }
      return "editor";
    },
    [user?.id, user?.email],
  );

  // Load Projects and Project Folders
  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    try {
      const list = await api.getProjects();
      setProjects(list);

      if (list.length > 0) {
        // If on an editor route, do not hijack currentProject unless it is not yet loaded
        const targetProjId = routeFileId
          ? (currentProject?.id || list[0].id)
          : (currentProject?.id || routeProjectId || list[0].id);
        const targetProj = list.find((p) => p.id === targetProjId) || list[0];

        const fullProj = await api.getProject(targetProj.id);
        if (!routeFileId || !currentProject) {
          setCurrentProject(fullProj);
        }

        const role = computeRoleForProject(fullProj);
        setUserRole(role);

        // If NOT an editor route and doc is empty, set default file for preview
        if (!routeFileId && fullProj.files && fullProj.files.length > 0) {
          const targetFile = fullProj.files[0];
          setDoc(targetFile);
          setHistory([targetFile.elements || []]);
          setHistoryIndex(0);
        }
      }
    } catch (err: any) {
      console.warn("Could not load projects:", err);
    }
  }, [
    isAuthenticated,
    token,
    currentProject?.id,
    routeProjectId,
    routeFileId,
    computeRoleForProject,
  ]);

  useEffect(() => {
    if (!routeFileId) {
      setCurrentProject(null);
    }
    setProjects([]);
    loadProjects();
  }, [token, user?.id, routeFileId]);

  // Restore / Load Canvas directly from URL route (Figma Navigation & Refresh Persistence)
  useEffect(() => {
    if (!isAuthenticated || !routeFileId) return;

    // Prevent redundant fetch if document is already active for this route
    if (doc.id === routeFileId) return;

    let isSubscribed = true;
    setRouteFileError(null);
    setIsLoadingRouteFile(true);

    async function loadRouteCanvas() {
      try {
        // 10s timeout safeguard to prevent infinite hanging
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Canvas loading timed out (10s)")), 10000)
        );
        const freshDoc = await Promise.race([
          api.getDocument(routeFileId!),
          timeoutPromise,
        ]);

        if (!isSubscribed) return;

        setDoc(freshDoc);
        setHistory([freshDoc.elements || []]);
        setHistoryIndex(0);
        setIsLoadingRouteFile(false);

        if (freshDoc.projectId) {
          try {
            const parentProj = await api.getProject(freshDoc.projectId);
            if (isSubscribed) {
              setCurrentProject(parentProj);
              const role = computeRoleForProject(parentProj);
              setUserRole(role);
              if (user) {
                socketService.joinDocument(
                  freshDoc.id,
                  { id: user.id, name: user.name, color: user.color },
                  role,
                );
              }
            }
          } catch (pErr) {
            console.warn("Could not load parent project for route file:", pErr);
          }
        }
      } catch (err: any) {
        if (isSubscribed) {
          const errMsg = err?.message || "Canvas file not found";
          console.error("Failed to load route canvas:", err);
          setRouteFileError(errMsg);
          setIsLoadingRouteFile(false);
          toast.error(errMsg);
        }
      }
    }

    loadRouteCanvas();

    return () => {
      isSubscribed = false;
    };
  }, [routeFileId, isAuthenticated]);

  // Setup WebSocket Listeners for real-time multiplayer sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const cleanupUsers = socketService.onUsersUpdate((users) => {
      setRemoteUsers(users.filter((u) => u.userId !== user.id));
    });

    const cleanupUserLeft = socketService.onUserLeft(({ userId }) => {
      setRemoteUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    const cleanupCursor = socketService.onCursorUpdate((presence) => {
      if (presence.userId === user.id) return;
      setRemoteUsers((prev) => {
        const idx = prev.findIndex((u) => u.userId === presence.userId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...presence };
          return updated;
        }
        return [...prev, presence];
      });
    });

    const cleanupSelection = socketService.onSelectionUpdate((sel) => {
      if (sel.userId === user.id) return;
      setRemoteUsers((prev) => {
        const idx = prev.findIndex((u) => u.userId === sel.userId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            selectedElementIds: sel.selectedElementIds,
          };
          return updated;
        }
        return [
          ...prev,
          {
            userId: sel.userId,
            userName: sel.userName,
            color: sel.color,
            role: "editor",
            cursor: null,
            selectedElementIds: sel.selectedElementIds,
            lastActive: Date.now(),
          },
        ];
      });
    });

    // Real-time live canvas sync: when another user modifies elements, we see it immediately!
    const cleanupElements = socketService.onElementsUpdate((remoteElements) => {
      setDoc((prev) => ({ ...prev, elements: remoteElements }));
    });

    // Real-time live notes sync
    const cleanupNote = socketService.onNoteUpdate((remoteNotes) => {
      setDoc((prev) => ({ ...prev, notes: remoteNotes }));
    });

    // Real-time live comments sync: new pin created
    const cleanupCommentCreate = socketService.onCommentCreated((comment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    });

    // Real-time live comments sync: reply or resolve status updated
    const cleanupCommentUpdate = socketService.onCommentUpdated((comment) => {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c)),
      );
    });

    // Real-time live comments sync: comment pin deleted
    const cleanupCommentDelete = socketService.onCommentDeleted(
      ({ commentId }) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      },
    );

    return () => {
      cleanupUsers();
      cleanupUserLeft();
      cleanupCursor();
      cleanupSelection();
      cleanupElements();
      cleanupNote();
      cleanupCommentCreate();
      cleanupCommentUpdate();
      cleanupCommentDelete();
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  // Fetch comments whenever the active canvas document changes
  useEffect(() => {
    if (!doc.id || !isAuthenticated) {
      setComments([]);
      setActiveCommentId(null);
      setPendingPinPos(null);
      return;
    }

    let isCancelled = false;
    async function loadComments() {
      try {
        const list = await api.getComments(doc.id);
        if (!isCancelled) {
          setComments(list);
        }
      } catch (err) {
        console.warn("Could not load comments for canvas:", err);
      }
    }

    loadComments();
    return () => {
      isCancelled = true;
    };
  }, [doc.id, isAuthenticated]);

  // Switch Active File inside current Project Folder
  const handleSelectFile = useCallback(
    (file: WhiteboardDocument) => {
      setDoc(file);
      setSelectedElementIds([]);
      setHistory([file.elements || []]);
      setHistoryIndex(0);

      if (user) {
        socketService.joinDocument(
          file.id,
          { id: user.id, name: user.name, color: user.color },
          userRole,
        );
      }

      if (isMobile) {
        setSidebarOpen(false);
      }

      navigate(`/file/${file.id}`);
    },
    [user, userRole, isMobile, navigate],
  );

  // Open file and launch Canvas Editor (from Dashboard or Sidebar)
  const handleOpenFile = useCallback(
    (project: Project, file: WhiteboardDocument) => {
      setCurrentProject(project);
      const role = computeRoleForProject(project);
      setUserRole(role);
      handleSelectFile(file);
    },
    [computeRoleForProject, handleSelectFile],
  );

  // Canvas Comments Handlers (Figma-Style Canvas Comments)
  const handleCreateComment = useCallback(
    async (x: number, y: number, content: string) => {
      if (!doc.id) return;
      if (!canComment) {
        toast.error("Viewers cannot add comments. Ask for Commenter or Editor access.");
        return;
      }
      try {
        const author = user
          ? { id: user.id, name: user.name, color: user.color, email: user.email }
          : undefined;
        const newComment = await api.createComment(doc.id, x, y, content, author);
        setComments((prev) => [...prev, newComment]);
        setActiveCommentId(newComment.id);
        setPendingPinPos(null);
        if (activeTool === "comment") {
          setActiveTool("selection");
        }
        socketService.emitCommentCreate(newComment);
        toast.success("Comment added");
      } catch (err: any) {
        toast.error(err.message || "Failed to post comment");
      }
    },
    [doc.id, activeTool, canComment, user],
  );

  const handleReplyComment = useCallback(
    async (commentId: string, content: string) => {
      if (!canComment) {
        toast.error("Viewers cannot reply to comments.");
        return;
      }
      try {
        const author = user
          ? { id: user.id, name: user.name, color: user.color, email: user.email }
          : undefined;
        const updated = await api.replyComment(commentId, content, author);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updated : c)),
        );
        socketService.emitCommentUpdate(updated);
      } catch (err: any) {
        toast.error(err.message || "Failed to post reply");
      }
    },
    [canComment, user],
  );

  const handleResolveComment = useCallback(
    async (commentId: string) => {
      if (!canComment) {
        toast.error("Viewers cannot resolve comments.");
        return;
      }
      try {
        const updated = await api.resolveComment(commentId);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updated : c)),
        );
        socketService.emitCommentUpdate(updated);
        toast.success(
          updated.resolved ? "Comment resolved" : "Comment re-opened",
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to update comment status");
      }
    },
    [canComment],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await api.deleteComment(commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        if (activeCommentId === commentId) {
          setActiveCommentId(null);
        }
        socketService.emitCommentDelete(commentId);
        toast.success("Comment deleted");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete comment");
      }
    },
    [activeCommentId],
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
        console.error("Failed to select project:", err);
      }
    },
    [computeRoleForProject, handleSelectFile],
  );

  // Create New File in current Project Folder
  const handleCreateFile = async (title: string) => {
    if (!currentProject) return;
    try {
      const newFile = await api.createProjectFile(currentProject.id, title);
      toast.success(`Canvas "${title}" created!`);
      const updatedProj = await api.getProject(currentProject.id);
      setCurrentProject(updatedProj);
      setProjects((prev) =>
        prev.map((p) => (p.id === currentProject.id ? updatedProj : p)),
      );
      handleSelectFile(newFile);
    } catch (err: any) {
      toast.error(err.message || "Failed to create canvas");
    }
  };

  // Delete File from Project Folder (supports deleting the last remaining canvas as requested!)
  const handleDeleteFile = async (
    fileIdOrProjectId: string,
    maybeFileId?: string,
  ) => {
    const projectId = maybeFileId ? fileIdOrProjectId : currentProject?.id;
    const fileId = maybeFileId ? maybeFileId : fileIdOrProjectId;
    if (!projectId) return;

    try {
      await api.deleteProjectFile(projectId, fileId);
      toast.success("Canvas deleted successfully");
      const updatedProj = await api.getProject(projectId);
      setCurrentProject(updatedProj);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updatedProj : p)),
      );

      if (doc.id === fileId) {
        if (updatedProj.files && updatedProj.files.length > 0) {
          handleSelectFile(updatedProj.files[0]);
        } else {
          // If no canvases remain in this project folder, smoothly redirect to dashboard
          navigate("/");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete canvas");
    }
  };

  // Create New Project Folder (supports empty folder creation without forcing File A!)
  const handleCreateProject = async (name: string, description?: string) => {
    try {
      const newProj = await api.createProject(name, description, false);
      await loadProjects();
      setCurrentProject(newProj);
      setProjects((prev) => {
        if (prev.some((p) => p.id === newProj.id)) return prev;
        return [...prev, newProj];
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    }
  };

  // Update Project Folder (edit name / description)
  const handleUpdateProject = async (
    projectId: string,
    updates: { name?: string; description?: string },
  ) => {
    try {
      const updated = await api.updateProject(projectId, updates);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, ...updated } : p)),
      );
      if (currentProject?.id === projectId) {
        setCurrentProject((prev) => (prev ? { ...prev, ...updated } : prev));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update project folder");
      throw err;
    }
  };

  // Delete Project Folder
  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      toast.success("Project folder deleted");
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (currentProject?.id === projectId) {
        navigate("/");
        const remaining = projects.filter((p) => p.id !== projectId);
        setCurrentProject(remaining[0] || null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project folder");
      throw err;
    }
  };

  // Rename Canvas File (from Sidebar or Dashboard)
  const handleRenameFile = async (
    projectId: string,
    fileId: string,
    newTitle: string,
  ) => {
    try {
      await api.updateDocument(fileId, { title: newTitle });
      if (doc.id === fileId) {
        setDoc((prev) => ({ ...prev, title: newTitle }));
      }
      setCurrentProject((prev) =>
        prev && prev.id === projectId
          ? {
              ...prev,
              files: prev.files?.map((f) =>
                f.id === fileId ? { ...f, title: newTitle } : f,
              ),
            }
          : prev,
      );
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                files: p.files?.map((f) =>
                  f.id === fileId ? { ...f, title: newTitle } : f,
                ),
              }
            : p,
        ),
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to rename canvas");
      throw err;
    }
  };

  // Navigate Home to Dashboard & Refresh state
  const handleNavigateHome = useCallback(() => {
    navigate("/");
    loadProjects();
  }, [navigate, loadProjects]);

  // Update Elements (Editor action) & Broadcast Live to Other Users
  // CRITICAL FIX: Also updates in-memory currentProject and projects so navigating away and returning preserves data!
  const handleElementsChange = useCallback(
    (newElements: CanvasElement[], recordHistory = true) => {
      if (isViewer) return;

      setDoc((prev) => ({ ...prev, elements: newElements }));

      // Update in-memory project structures so returning to Dashboard or switching files never serves stale data
      setCurrentProject((prevProj) => {
        if (!prevProj || !prevProj.files) return prevProj;
        return {
          ...prevProj,
          files: prevProj.files.map((f) =>
            f.id === doc.id ? { ...f, elements: newElements } : f,
          ),
        };
      });

      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p.id !== doc.projectId) return p;
          return {
            ...p,
            files: p.files?.map((f) =>
              f.id === doc.id ? { ...f, elements: newElements } : f,
            ),
          };
        }),
      );

      // Broadcast live to WebSockets & Redis Pub/Sub (Socket Gateway automatically persists to DB!)
      socketService.emitElementsChange(newElements, true);

      if (recordHistory) {
        setHistory((prev) => {
          const next = prev.slice(0, historyIndex + 1);
          return [...next, newElements].slice(-50);
        });
        setHistoryIndex((prev) => prev + 1);

        setSaveStatus("synced");

        // Only fallback to HTTP API if socket is disconnected
        if (!socketService.isConnected()) {
          setSaveStatus("saving");
          api
            .syncElements(doc.id, newElements)
            .then(() => setSaveStatus("synced"))
            .catch(() => setSaveStatus("synced"));
        }
      }
    },
    [doc.id, doc.projectId, historyIndex, isViewer],
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (isViewer) return;
    if (historyIndex > 0) {
      const prevElements = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      setDoc((prev) => ({ ...prev, elements: prevElements }));
      socketService.emitElementsChange(prevElements, true);
      if (!socketService.isConnected()) {
        api.syncElements(doc.id, prevElements).catch(console.error);
      }
    }
  }, [doc.id, history, historyIndex, isViewer]);

  const handleRedo = useCallback(() => {
    if (isViewer) return;
    if (historyIndex < history.length - 1) {
      const nextElements = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      setDoc((prev) => ({ ...prev, elements: nextElements }));
      socketService.emitElementsChange(nextElements, true);
      if (!socketService.isConnected()) {
        api.syncElements(doc.id, nextElements).catch(console.error);
      }
    }
  }, [doc.id, history, historyIndex, isViewer]);

  // Notes update (Editor action) & Live Broadcast
  const notesDebounceTimerRef = useRef<any>(null);

  const handleNotesChange = useCallback(
    (newNotes: string) => {
      if (isViewer) return;
      setDoc((prev) => ({ ...prev, notes: newNotes }));

      setCurrentProject((prevProj) => {
        if (!prevProj || !prevProj.files) return prevProj;
        return {
          ...prevProj,
          files: prevProj.files.map((f) =>
            f.id === doc.id ? { ...f, notes: newNotes } : f,
          ),
        };
      });

      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p.id !== doc.projectId) return p;
          return {
            ...p,
            files: p.files?.map((f) =>
              f.id === doc.id ? { ...f, notes: newNotes } : f,
            ),
          };
        }),
      );

      // Sync via socket (socket gateway broadcasts and persists to DB)
      socketService.emitNoteChange(newNotes);

      // Fall back to debounced HTTP API only if socket is disconnected
      if (!socketService.isConnected()) {
        if (notesDebounceTimerRef.current)
          clearTimeout(notesDebounceTimerRef.current);
        notesDebounceTimerRef.current = setTimeout(() => {
          api.updateDocument(doc.id, { notes: newNotes }).catch(console.error);
        }, 1000);
      }
    },
    [doc.id, doc.projectId, isViewer],
  );

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
              files: prev.files?.map((f) =>
                f.id === doc.id ? { ...f, title: newTitle } : f,
              ),
            }
          : null,
      );
      setProjects((prev) =>
        prev.map((p) =>
          p.id === doc.projectId
            ? {
                ...p,
                files: p.files?.map((f) =>
                  f.id === doc.id ? { ...f, title: newTitle } : f,
                ),
              }
            : p,
        ),
      );
    }
  };

  // Camera Navigation Interaction State for Comments Fade (Figma style)
  const [isCanvasInteracting, setIsCanvasInteracting] = useState(false);
  const navInteractionTimerRef = useRef<any>(null);

  const triggerNavInteraction = useCallback(() => {
    setIsCanvasInteracting(true);
    const overlay = document.getElementById("sailboard-comments-overlay");
    if (overlay) overlay.style.opacity = "0";
    const popovers = document.querySelectorAll(".sailboard-comment-popover");
    popovers.forEach((p) => {
      (p as HTMLElement).style.opacity = "0";
      (p as HTMLElement).style.pointerEvents = "none";
    });

    if (navInteractionTimerRef.current) clearTimeout(navInteractionTimerRef.current);
    navInteractionTimerRef.current = setTimeout(() => {
      setIsCanvasInteracting(false);
      if (overlay) overlay.style.opacity = "1";
      popovers.forEach((p) => {
        (p as HTMLElement).style.opacity = "1";
        (p as HTMLElement).style.pointerEvents = "auto";
      });
    }, 180);
  }, []);

  // Zoom Helpers
  const handleZoomIn = useCallback(() => {
    triggerNavInteraction();
    setZoom((prev) => Math.min(prev + 0.15, 3));
  }, [triggerNavInteraction]);

  const handleZoomOut = useCallback(() => {
    triggerNavInteraction();
    setZoom((prev) => Math.max(prev - 0.15, 0.2));
  }, [triggerNavInteraction]);

  const handleZoomReset = useCallback(() => {
    triggerNavInteraction();
    setZoom(1);
    setPan({ x: 60, y: 60 });
  }, [triggerNavInteraction]);

  const handleZoomToFit = useCallback(() => {
    triggerNavInteraction();
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
  }, [doc.elements, handleZoomReset, triggerNavInteraction]);

  const handleSelectElements = useCallback((ids: string[]) => {
    setSelectedElementIds(ids);
    socketService.emitSelectionChange(ids);
  }, []);

  // Element Actions (Duplicate, Delete, Lock, Flip, Align, Group)
  const handleDuplicate = useCallback(() => {
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
    handleSelectElements(newSelectedIds);
  }, [doc.elements, selectedElementIds, handleElementsChange, handleSelectElements, isViewer]);

  const handleDeleteSelected = useCallback(() => {
    if (isViewer || selectedElementIds.length === 0) return;
    const updated = doc.elements.filter(
      (el) => !selectedElementIds.includes(el.id),
    );
    handleElementsChange(updated);
    handleSelectElements([]);
  }, [doc.elements, selectedElementIds, handleElementsChange, handleSelectElements, isViewer]);

  const handleBringToFront = useCallback(() => {
    if (isViewer || selectedElementIds.length === 0) return;
    const selected = doc.elements.filter((el) =>
      selectedElementIds.includes(el.id),
    );
    const others = doc.elements.filter(
      (el) => !selectedElementIds.includes(el.id),
    );
    handleElementsChange([...others, ...selected]);
  }, [doc.elements, selectedElementIds, handleElementsChange, isViewer]);

  const handleSendToBack = useCallback(() => {
    if (isViewer || selectedElementIds.length === 0) return;
    const selected = doc.elements.filter((el) =>
      selectedElementIds.includes(el.id),
    );
    const others = doc.elements.filter(
      (el) => !selectedElementIds.includes(el.id),
    );
    handleElementsChange([...selected, ...others]);
  }, [doc.elements, selectedElementIds, handleElementsChange, isViewer]);

  const handleLockToggle = useCallback(() => {
    if (isViewer || selectedElementIds.length === 0) return;
    const anyUnlocked = doc.elements.some(
      (el) => selectedElementIds.includes(el.id) && !el.locked
    );
    const updated = doc.elements.map((el) => {
      if (selectedElementIds.includes(el.id)) {
        return { ...el, locked: anyUnlocked, updatedAt: Date.now() };
      }
      return el;
    });
    handleElementsChange(updated, true);
    toast.success(anyUnlocked ? "Locked selection" : "Unlocked selection");
  }, [doc.elements, selectedElementIds, handleElementsChange, isViewer]);

  const handleFlipHorizontal = useCallback(() => {
    if (isViewer || selectedElementIds.length === 0) return;
    const updated = flipElements(doc.elements, selectedElementIds, "horizontal");
    handleElementsChange(updated, true);
  }, [doc.elements, selectedElementIds, handleElementsChange, isViewer]);

  const handleFlipVertical = useCallback(() => {
    if (isViewer || selectedElementIds.length === 0) return;
    const updated = flipElements(doc.elements, selectedElementIds, "vertical");
    handleElementsChange(updated, true);
  }, [doc.elements, selectedElementIds, handleElementsChange, isViewer]);

  const handleAlign = useCallback(
    (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (isViewer || selectedElementIds.length < 2) return;
      const updated = alignElements(doc.elements, selectedElementIds, alignment);
      handleElementsChange(updated, true);
    },
    [doc.elements, selectedElementIds, handleElementsChange, isViewer]
  );

  const handleDistribute = useCallback(
    (direction: "horizontal" | "vertical") => {
      if (isViewer || selectedElementIds.length < 2) return;
      const updated = distributeElements(doc.elements, selectedElementIds, direction);
      handleElementsChange(updated, true);
    },
    [doc.elements, selectedElementIds, handleElementsChange, isViewer]
  );

  const handleGroup = useCallback(() => {
    if (isViewer || selectedElementIds.length < 2) return;
    const updated = groupElements(doc.elements, selectedElementIds);
    handleElementsChange(updated, true);
    toast.success("Grouped elements");
  }, [doc.elements, selectedElementIds, handleElementsChange, isViewer]);

  const handleUngroup = useCallback(() => {
    if (isViewer || selectedElementIds.length === 0) return;
    const updated = ungroupElements(doc.elements, selectedElementIds);
    handleElementsChange(updated, true);
    toast.success("Ungrouped elements");
  }, [doc.elements, selectedElementIds, handleElementsChange, isViewer]);

  // Global Keyboard Shortcuts (Zoom, Undo, Redo, Tools, Lock, Flip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA"].includes(target.tagName) ||
        target.isContentEditable
      )
        return;

      // Ctrl + / Ctrl - / Ctrl 0 zoom shortcuts & Command Palette
      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey && e.key.toLowerCase() === "l") {
          e.preventDefault();
          handleLockToggle();
          return;
        }

        if (e.shiftKey && e.key.toLowerCase() === "g") {
          e.preventDefault();
          handleUngroup();
          return;
        }

        if (!e.shiftKey && e.key.toLowerCase() === "g") {
          e.preventDefault();
          handleGroup();
          return;
        }

        if (e.key.toLowerCase() === "k") {
          e.preventDefault();
          setCommandPaletteOpen((prev) => !prev);
          return;
        }

        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoomIn();
          return;
        }
        if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          handleZoomOut();
          return;
        }
        if (e.key === "0") {
          e.preventDefault();
          handleZoomReset();
          return;
        }

        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
          return;
        }

        if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      if (isViewer) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      // Shift + H / Shift + V for Flip Horizontal / Vertical
      if (e.shiftKey) {
        if (e.key.toUpperCase() === "H") {
          e.preventDefault();
          handleFlipHorizontal();
          return;
        }
        if (e.key.toUpperCase() === "V") {
          e.preventDefault();
          handleFlipVertical();
          return;
        }
      }

      // Tool shortcuts
      const key = e.key.toUpperCase();
      switch (key) {
        case "Q":
          e.preventDefault();
          handleToggleToolLock();
          break;
        case "V":
        case "1":
          setActiveTool("selection");
          break;
        case "C":
          if (canComment) setActiveTool("comment");
          break;
        case "H":
          setActiveTool("pan");
          break;
        case "R":
        case "2":
          if (canEdit) setActiveTool("rectangle");
          break;
        case "D":
        case "3":
          if (canEdit) setActiveTool("diamond");
          break;
        case "O":
        case "4":
          if (canEdit) setActiveTool("ellipse");
          break;
        case "A":
        case "5":
          if (canEdit) setActiveTool("arrow");
          break;
        case "L":
        case "6":
          if (canEdit) setActiveTool("line");
          break;
        case "P":
        case "7":
          if (canEdit) setActiveTool("draw");
          break;
        case "T":
        case "8":
          if (canEdit) setActiveTool("text");
          break;
        case "S":
          if (canEdit) setActiveTool("sticky");
          break;
        case "F":
          if (canEdit) setActiveTool("frame");
          break;
        case "E":
        case "0":
          if (canEdit) setActiveTool("eraser");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedElementIds,
    handleUndo,
    handleRedo,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleDuplicate,
    handleDeleteSelected,
    handleLockToggle,
    handleFlipHorizontal,
    handleFlipVertical,
    handleGroup,
    handleUngroup,
    isViewer,
    canEdit,
    canComment,
  ]);

  const selectedElementIdsRef = useRef(selectedElementIds);
  selectedElementIdsRef.current = selectedElementIds;

  const handleCursorMove = useCallback((cursor: Point) => {
    socketService.emitCursorMove(cursor, selectedElementIdsRef.current);
  }, []);

  const handleDropCommentPin = useCallback((worldPt: Point) => {
    setPendingPinPos(worldPt);
    setActiveCommentId(null);
    setShowComments(true);
  }, []);

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

  // Open Doc to Diagram Studio Modal (Eraser-grade Diagram-as-Code & Architecture Studio)
  const handleGenerateDiagramFromNotes = useCallback(() => {
    if (isViewer) return;
    setDocToDiagramOpen(true);
  }, [isViewer]);

  // Import JSON or Excalidraw File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        // 1. Excalidraw format detection
        if (parsed.type === "excalidraw" || (Array.isArray(parsed.elements) && parsed.version === 2)) {
          const imported = (parsed.elements || []).map((el: any) => {
            let elType: ElementType = el.type;
            if ((el.type as string) === "freedraw") elType = "draw";

            let pts = el.points;
            if (Array.isArray(pts) && pts.length > 0 && Array.isArray(pts[0])) {
              pts = pts.map((p: any) => ({ x: p[0], y: p[1] }));
            }

            return {
              id: el.id || `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              type: elType,
              x: el.x || 0,
              y: el.y || 0,
              width: el.width || 100,
              height: el.height || 100,
              angle: el.angle || 0,
              strokeColor: el.strokeColor || "#000000",
              backgroundColor: el.backgroundColor || "transparent",
              fillStyle: el.fillStyle || "hachure",
              strokeWidth: el.strokeWidth || 2,
              strokeStyle: el.strokeStyle || "solid",
              roughness: el.roughness ?? 1,
              opacity: el.opacity ?? 100,
              roundness: el.roundness ? "round" : "sharp",
              fontFamily:
                el.fontFamily === 3
                  ? "monospace"
                  : el.fontFamily === 2
                  ? "sans-serif"
                  : "hand-drawn",
              textAlign: el.textAlign || "center",
              startArrowhead: el.startArrowhead || "none",
              endArrowhead: el.endArrowhead || "none",
              text: el.text || "",
              fontSize: el.fontSize || 16,
              imageUrl: el.imageUrl,
              locked: Boolean(el.locked),
              groupIds: el.groupIds,
              points: pts,
              seed: el.seed || Math.floor(Math.random() * 100000),
              version: 1,
              versionNonce: 1,
              isDeleted: false,
              updatedAt: Date.now(),
            } as CanvasElement;
          });

          handleElementsChange(imported, true);
          toast.success("Imported .excalidraw whiteboard!");
          return;
        }

        // 2. Standard Sailboard format
        if (parsed.elements && Array.isArray(parsed.elements)) {
          handleElementsChange(parsed.elements);
          toast.success("Whiteboard elements imported!");
        } else if (parsed.document && parsed.document.elements) {
          handleElementsChange(parsed.document.elements);
          if (parsed.document.notes)
            setDoc((prev) => ({ ...prev, notes: parsed.document.notes }));
          toast.success("Document imported successfully!");
        }
      } catch (err) {
        toast.error("Invalid whiteboard file format");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Split-screen drag handling
  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(
        260,
        Math.min(
          moveEvent.clientX - (sidebarOpen ? 280 : 56),
          window.innerWidth - 380,
        ),
      );
      setSplitWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleViewModeChange = (mode: "canvas" | "split" | "notes") => {
    if (isMobile && mode === "split") {
      setViewMode("canvas");
    } else {
      setViewMode(mode);
    }
  };

  const appToaster = (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: effectiveThemeMode === "dark" ? "#1e293b" : "#ffffff",
          color: effectiveThemeMode === "dark" ? "#f8fafc" : "#0f172a",
          border: `1px solid ${effectiveThemeMode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: "12px",
          fontSize: "0.875rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        },
      }}
    />
  );

  // 1. Loading State
  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {appToaster}
        <Box
          sx={{
            width: "100vw",
            height: "100vh",
            bgcolor: "#090d16",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 3,
              background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.35)",
            }}
          >
            <SailingOutlined sx={{ fontSize: 28, color: "#ffffff" }} />
          </Box>
          <CircularProgress size={32} sx={{ color: "#6366f1" }} />
          <Typography
            variant="body2"
            sx={{ color: "#94a3b8", fontWeight: 600 }}
          >
            Loading Sailboard...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // 2. Unauthenticated: Show production login page by default
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {appToaster}
        <AuthScreen />
      </ThemeProvider>
    );
  }

  // 3. Authenticated: Route File Error State (e.g., file not found, access denied, timeout)
  if (isEditorRoute && routeFileError) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {appToaster}
        <Box
          sx={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "var(--neu-bg)",
            p: 2,
          }}
        >
          <Box
            className="neu-card"
            sx={{
              p: 4,
              borderRadius: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2.5,
              bgcolor: "var(--neu-surface)",
              boxShadow: "var(--neu-shadow-raised)",
              border: "var(--neu-border)",
              maxWidth: 420,
              width: "100%",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "18px",
                background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
              }}
            >
              <SailingOutlined sx={{ fontSize: 32, color: "#ffffff" }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "var(--neu-text-primary)", mb: 0.5 }}
              >
                Canvas Not Found
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "var(--neu-text-secondary)", fontSize: "0.85rem" }}
              >
                {routeFileError || "The requested canvas could not be loaded or may have been deleted."}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, width: "100%", mt: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setRouteFileError(null);
                  navigate("/", { replace: true });
                }}
                className="neu-btn"
                sx={{
                  py: 1,
                  borderRadius: "12px",
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Dashboard
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setRouteFileError(null);
                  setIsLoadingRouteFile(true);
                  setDoc((prev) => ({ ...prev, id: "" }));
                }}
                className="neu-btn-primary"
                sx={{
                  py: 1,
                  borderRadius: "12px",
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Try Again
              </Button>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  // 4. Authenticated: If on editor route and loading route file or doc not populated yet:
  if (isEditorRoute && (isLoadingRouteFile || !doc.id)) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {appToaster}
        <Box
          sx={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "var(--neu-bg)",
            gap: 2,
          }}
        >
          <Box
            className="neu-flat"
            sx={{
              p: 4,
              borderRadius: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              bgcolor: "var(--neu-surface)",
              boxShadow: "var(--neu-shadow-raised)",
              border: "var(--neu-border)",
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-light) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px var(--neu-primary-glow)",
              }}
            >
              <SailingOutlined sx={{ fontSize: 32, color: "#ffffff" }} />
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "var(--neu-text-primary)" }}
            >
              Opening Canvas...
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--neu-text-secondary)", fontSize: "0.82rem" }}
            >
              Restoring workspace & syncing multiplayer engine
            </Typography>
            <CircularProgress
              size={26}
              sx={{ color: "var(--neu-primary)", mt: 0.5 }}
            />
            <Button
              variant="text"
              size="small"
              onClick={() => navigate("/", { replace: true })}
              sx={{
                color: "var(--neu-text-secondary)",
                fontSize: "0.75rem",
                textTransform: "none",
                mt: 1,
                "&:hover": { color: "var(--neu-primary)" },
              }}
            >
              Cancel & Return to Dashboard
            </Button>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  // 4. Authenticated: Render Figma-style Projects Workspace Dashboard
  if (currentView === "dashboard") {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {appToaster}
        <Dashboard
          user={user}
          projects={projects}
          currentProject={currentProject}
          onSelectProject={(projectId) => {
            const found = projects.find((p) => p.id === projectId);
            if (found) setCurrentProject(found);
          }}
          onOpenFile={handleOpenFile}
          initialFolderId={routeProjectId || undefined}
          onFolderChange={(folderId) => {
            if (folderId === "all") navigate("/", { replace: true });
            else navigate(`/project/${folderId}`, { replace: true });
          }}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onRenameFile={handleRenameFile}
          onCreateFile={async (projectId, title) => {
            try {
              const newFile = await api.createProjectFile(projectId, title);
              await loadProjects();
              const updatedProj = await api.getProject(projectId);
              setCurrentProject(updatedProj);
              handleOpenFile(updatedProj, newFile);
            } catch (err: any) {
              toast.error(err.message || "Failed to create canvas");
            }
          }}
          onDeleteFile={handleDeleteFile}
          onOpenShare={(proj) => {
            setCurrentProject(proj);
            setShareOpen(true);
          }}
          onOpenAccountManage={() => setAccountManageOpen(true)}
          onLogout={logout}
          themePreference={themePreference}
          onThemeChange={setThemePreference}
          themeMode={effectiveThemeMode}
          onToggleTheme={() =>
            setThemePreference((m) => (m === "light" ? "dark" : "light"))
          }
        />

        {/* Share & Permissions Dialog */}
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          project={currentProject}
          onProjectUpdated={(p) => {
            setCurrentProject(p);
            const role = computeRoleForProject(p);
            setUserRole(role);
            loadProjects();
          }}
        />

        {/* Account Management & Multi-Account Switcher Dialog */}
        <AccountManageDialog
          open={accountManageOpen}
          onClose={() => setAccountManageOpen(false)}
          onAddAccountClick={() => {
            setAccountManageOpen(false);
            setAuthDialogMode("add-account");
            setAuthDialogOpen(true);
          }}
        />

        {/* Auth Dialog (for adding accounts or signing in) */}
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          title={
            authDialogMode === "add-account"
              ? "Add Another Account"
              : "Sailboard Account"
          }
          subtitle={
            authDialogMode === "add-account"
              ? "Connect another profile to switch anytime on this device"
              : "Production Collaborative Workspace"
          }
        />
        {/* Fast Command Palette (⌘K / Ctrl+K) */}
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          projects={projects}
          currentProject={currentProject}
          currentFile={doc}
          onSelectProject={handleSelectProject}
          onOpenFile={handleOpenFile}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onCreateProject={handleCreateProject}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          theme={effectiveThemeMode}
          themePreference={themePreference}
          onThemeChange={setThemePreference}
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((v) => !v)}
          gridSnap={gridSnap}
          onToggleSnap={() => setGridSnap((s) => !s)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          styleMode={styleMode}
          onStyleModeChange={setStyleMode}
          onOpenShare={() => setShareOpen(true)}
          onOpenExport={() => setExportOpen(true)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
      </ThemeProvider>
    );
  }

  const selectedElements = doc.elements.filter(
    (el) => selectedElementIds.includes(el.id) && !el.isDeleted,
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {appToaster}
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "var(--neu-bg)",
        }}
      >
        {/* Hidden File Input for Import */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".json,.sailboard,.excalidraw"
          onChange={handleImportFile}
        />

        {/* Global Navigation Header */}
        <Header
          projectName={currentProject?.name || "Sailboard Project"}
          userRole={userRole}
          title={doc.title}
          onTitleChange={handleTitleChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          styleMode={styleMode}
          onStyleModeChange={setStyleMode}
          theme={effectiveThemeMode}
          themePreference={themePreference}
          onThemeChange={setThemePreference}
          onThemeToggle={() =>
            setThemePreference((m) => (m === "light" ? "dark" : "light"))
          }
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
          onOpenAuth={() => setAuthDialogOpen(true)}
          onOpenAccountManage={() => setAccountManageOpen(true)}
          onLogout={logout}
          currentUser={user}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onNavigateHome={handleNavigateHome}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          commentsCount={comments.filter((c) => !c.resolved).length}
          showComments={showComments}
          onToggleComments={() => setShowComments((v) => !v)}
        />

        {/* Viewer Mode Alert Banner */}
        {isViewer && (
          <ViewerNoticeBanner
            ownerName={currentProject?.ownerName || "Project Owner"}
            userRole={userRole}
            onOpenShare={() => setShareOpen(true)}
            onOpenAuth={() => setAuthDialogOpen(true)}
            onOpenAccountManage={() => setAccountManageOpen(true)}
          />
        )}

        {/* Workspace Body: Sidebar + Editor/Canvas Area */}
        <Box
          sx={{
            display: "flex",
            flexGrow: 1,
            height: "calc(100vh - 52px)",
            position: "relative",
            overflow: "hidden",
            bgcolor: "var(--neu-bg)",
            width: "100%",
            maxWidth: "100vw",
          }}
        >
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
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onRenameFile={(fileId, newTitle) =>
              handleRenameFile(doc.projectId, fileId, newTitle)
            }
            onOpenShare={() => setShareOpen(true)}
            onOpenAuth={() => setAuthDialogOpen(true)}
            onOpenAccountManage={() => setAccountManageOpen(true)}
            userRole={userRole}
            onNavigateHome={handleNavigateHome}
          />

          {/* Left Split: Markdown Documentation */}
          <Box
            ref={notesPanelRef}
            sx={{
              width: viewMode === "split" ? `${splitWidth}px` : viewMode === "notes" ? "100%" : 0,
              display: viewMode === "canvas" ? "none" : "flex",
              opacity: viewMode === "canvas" ? 0 : 1,
              flexShrink: 0,
              minWidth: 0,
              height: "100%",
              bgcolor: "var(--neu-bg)",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
              transition: isDraggingSplit ? "none" : "width 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease",
            }}
          >
            <NotesEditor
              key={doc.id}
              notes={doc.notes}
              onChange={handleNotesChange}
              onGenerateDiagramFromNotes={handleGenerateDiagramFromNotes}
              theme={effectiveThemeMode}
              isViewer={isViewer}
            />
          </Box>

          {/* Resizable Divider Handle between Docs and Canvas */}
          <Box
            ref={dividerRef}
            onMouseDown={handleSplitMouseDown}
            sx={{
              width: viewMode === "split" ? 6 : 0,
              display: viewMode === "split" ? "block" : "none",
              opacity: viewMode === "split" ? 1 : 0,
              cursor: "col-resize",
              bgcolor: isDraggingSplit
                ? "var(--neu-primary)"
                : "var(--neu-surface)",
              borderLeft: "var(--neu-border-subtle)",
              borderRight: "var(--neu-border-subtle)",
              boxShadow: "var(--neu-shadow-raised-sm)",
              zIndex: 35,
              overflow: "hidden",
              boxSizing: "border-box",
              transition: "background-color 0.15s ease",
              "&:hover": { bgcolor: "var(--neu-primary)" },
            }}
          />

          {/* Right Split: Infinite Vector Canvas */}
          <Box
            ref={canvasContainerRef}
            sx={{
              display: viewMode === "notes" ? "none" : "block",
              flexGrow: viewMode === "notes" ? 0 : 1,
              flexShrink: 1,
              width: viewMode === "canvas" ? "100%" : viewMode === "notes" ? 0 : "auto",
              minWidth: 0,
              height: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
              {/* Floating Toolbar */}
              <Toolbar
                activeTool={activeTool}
                onToolSelect={setActiveTool}
                isToolLocked={isToolLocked}
                onToggleToolLock={handleToggleToolLock}
                onImageSelected={(dataUrl) => {
                  const newImgEl: CanvasElement = {
                    id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    type: "image",
                    x: -pan.x / zoom + (canvasContainerRef.current?.clientWidth || 800) / (2 * zoom) - 150,
                    y: -pan.y / zoom + (canvasContainerRef.current?.clientHeight || 600) / (2 * zoom) - 100,
                    width: 300,
                    height: 200,
                    angle: 0,
                    strokeColor: "transparent",
                    backgroundColor: "transparent",
                    fillStyle: "none",
                    strokeWidth: 1,
                    strokeStyle: "solid",
                    roughness: 0,
                    opacity: 100,
                    imageUrl: dataUrl,
                    seed: Math.floor(Math.random() * 100000),
                    version: 1,
                    versionNonce: 1,
                    isDeleted: false,
                    updatedAt: Date.now(),
                  };
                  handleElementsChange([...doc.elements, newImgEl], true);
                  handleSelectElements([newImgEl.id]);
                }}
                theme={effectiveThemeMode}
                isViewer={isViewer}
                canComment={canComment}
              />

              {/* Floating Properties Inspector (Only open when user selects a shape or picks a draw tool) */}
              {!isViewer &&
                (selectedElements.length > 0 ||
                  [
                    'rectangle',
                    'diamond',
                    'ellipse',
                    'arrow',
                    'line',
                    'draw',
                    'text',
                    'sticky',
                    'frame',
                  ].includes(activeTool)) && (
                <PropertiesPanel
                  selectedElements={selectedElements}
                  currentStyle={currentStyle}
                  onUpdateStyle={handleUpdateStyle}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDeleteSelected}
                  onBringToFront={handleBringToFront}
                  onSendToBack={handleSendToBack}
                  theme={effectiveThemeMode}
                  activeTool={activeTool}
                  onLockToggle={handleLockToggle}
                  onFlipHorizontal={handleFlipHorizontal}
                  onFlipVertical={handleFlipVertical}
                  onAlign={handleAlign}
                  onDistribute={handleDistribute}
                />
              )}

              {/* Main Canvas Component */}
              <Canvas
                elements={doc.elements}
                onElementsChange={handleElementsChange}
                selectedElementIds={selectedElementIds}
                onSelectElements={handleSelectElements}
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onDropCommentPin={handleDropCommentPin}
                theme={effectiveThemeMode}
                isToolLocked={isToolLocked}
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
                onCursorMove={handleCursorMove}
                isViewer={isViewer}
                canComment={canComment}
                onInteractionChange={setIsCanvasInteracting}
              />

              {/* Figma-Style Canvas Comment Pins */}
              <CanvasComments
                comments={comments}
                activeCommentId={activeCommentId}
                onSelectComment={setActiveCommentId}
                onCreateComment={handleCreateComment}
                onReplyComment={handleReplyComment}
                onResolveComment={handleResolveComment}
                onDeleteComment={handleDeleteComment}
                zoom={zoom}
                pan={pan}
                theme={effectiveThemeMode}
                currentUser={user}
                isViewer={userRole === "viewer"}
                canComment={canComment}
                isOwner={isOwner}
                isEditor={isEditor}
                isInteracting={isCanvasInteracting}
                viewportWidth={canvasContainerRef.current?.clientWidth}
                viewportHeight={canvasContainerRef.current?.clientHeight}
                pendingPinPos={pendingPinPos}
                onCancelPendingPin={() => {
                  setPendingPinPos(null);
                  if (activeTool === "comment") setActiveTool("selection");
                }}
                visible={showComments}
              />

              {/* Bottom Right Minimap */}
              <Minimap
                elements={doc.elements}
                zoom={zoom}
                pan={pan}
                containerWidth={canvasContainerRef.current?.clientWidth || 800}
                containerHeight={
                  canvasContainerRef.current?.clientHeight || 600
                }
                onNavigate={(newPan) => {
                  triggerNavInteraction();
                  setPan(newPan);
                }}
                theme={effectiveThemeMode}
              />
            </Box>
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

        {/* Export Modal */}
        <ExportDialog
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          document={doc}
          theme={effectiveThemeMode}
          styleMode={styleMode}
        />

        {/* Doc to Diagram Studio Modal (Eraser-grade Diagram-as-Code & Architecture Studio) */}
        <DocToDiagramModal
          open={docToDiagramOpen}
          onClose={() => setDocToDiagramOpen(false)}
          initialText={doc.notes}
          existingElements={doc.elements}
          onInsertElements={(newElements, replace) => {
            const nextElements = replace
              ? newElements
              : [...doc.elements, ...newElements];
            handleElementsChange(nextElements, true);
            setSelectedElementIds(newElements.map((e) => e.id));
          }}
          styleMode={styleMode}
          theme={effectiveThemeMode}
        />

        {/* Account Management & Multi-Account Switcher Dialog */}
        <AccountManageDialog
          open={accountManageOpen}
          onClose={() => setAccountManageOpen(false)}
          onAddAccountClick={() => {
            setAccountManageOpen(false);
            setAuthDialogMode("add-account");
            setAuthDialogOpen(true);
          }}
        />

        {/* Auth Dialog (for adding accounts or signing in) */}
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          title={
            authDialogMode === "add-account"
              ? "Add Another Account"
              : "Sailboard Account"
          }
          subtitle={
            authDialogMode === "add-account"
              ? "Connect another profile to switch anytime on this device"
              : "Production Collaborative Workspace"
          }
        />
        {/* Fast Command Palette (⌘K / Ctrl+K) */}
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          projects={projects}
          currentProject={currentProject}
          currentFile={doc}
          onSelectProject={handleSelectProject}
          onOpenFile={handleOpenFile}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onCreateProject={handleCreateProject}
          activeTool={activeTool}
          onSelectTool={(tool) => {
            if (tool === "comment" && !canComment) {
              toast.error("Viewers cannot add comments.");
              return;
            }
            if (
              tool !== "selection" &&
              tool !== "pan" &&
              tool !== "comment" &&
              !canEdit
            ) {
              toast.error("Canvas elements are read-only.");
              return;
            }
            setActiveTool(tool);
          }}
          theme={effectiveThemeMode}
          themePreference={themePreference}
          onThemeChange={setThemePreference}
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((v) => !v)}
          gridSnap={gridSnap}
          onToggleSnap={() => setGridSnap((s) => !s)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          styleMode={styleMode}
          onStyleModeChange={setStyleMode}
          onOpenShare={() => setShareOpen(true)}
          onOpenExport={() => setExportOpen(true)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
      </Box>
    </ThemeProvider>
  );
}
