import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  SearchOutlined,
  AddOutlined,
  FolderOutlined,
  DescriptionOutlined,
  MoreVertOutlined,
  ShareOutlined,
  DeleteOutlined,
  CreateNewFolderOutlined,
  LogoutOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  SettingsBrightnessOutlined,
  CheckOutlined,
  SailingOutlined,
  MenuOpenOutlined,
  SpaceDashboardOutlined,
  AutoAwesomeOutlined,
  ManageAccountsOutlined,
  EditOutlined,
} from "@mui/icons-material";
import { Project, WhiteboardDocument, User } from "@rea/shared-types";
import toast from "react-hot-toast";
import { renderScene } from "../canvas/renderer";
import { ThemePreference } from "../theme/theme";
import {
  ConfirmDeleteModal,
  CreateProjectModal,
  CreateFileModal,
  EditProjectModal,
  RenameFileModal,
} from "./modals";
import {
  animateHeaderIn,
  animateStaggerIn,
  useCardHover,
} from "../utils/animations";

// 3D Magnetic Tactile Card with GSAP Spring Physics
function DashboardCard({
  children,
  sx,
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <Card
      ref={cardRef}
      className={`neu-card ${className || ""}`}
      sx={{
        borderRadius: "16px",
        bgcolor: "var(--neu-card)",
        boxShadow: "var(--neu-shadow-raised)",
        border: "var(--neu-border)",
        transformStyle: "preserve-3d",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}

interface DashboardProps {
  user: User | null;
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (projectId: string) => void;
  onOpenFile: (project: Project, file: WhiteboardDocument) => void;
  onCreateProject: (name: string, description?: string) => Promise<void>;
  onUpdateProject?: (
    projectId: string,
    updates: { name?: string; description?: string },
  ) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onCreateFile: (projectId: string, title: string) => Promise<void>;
  onDeleteFile: (projectId: string, fileId: string) => Promise<void>;
  onRenameFile?: (
    projectId: string,
    fileId: string,
    newTitle: string,
  ) => Promise<void>;
  onOpenShare: (project: Project) => void;
  onOpenAccountManage?: () => void;
  onLogout: () => void;
  initialFolderId?: string;
  onFolderChange?: (folderId: string) => void;
  themePreference?: ThemePreference;
  onThemeChange?: (pref: ThemePreference) => void;
  themeMode: "light" | "dark";
  onToggleTheme: () => void;
}

// Mini Canvas Thumbnail Preview for Figma File Cards
function FileThumbnail({
  file,
  themeMode,
}: {
  file: WhiteboardDocument;
  themeMode: "light" | "dark";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeElements = file.elements?.filter((e) => !e.isDeleted) || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Render scaled mini preview
    renderScene(canvas, activeElements, {
      theme: themeMode,
      gridVisible: true,
      gridType: "dots",
      zoom: 0.18,
      pan: { x: 30, y: 25 },
      selectedElementIds: [],
      selectionBox: null,
      remoteUsers: [],
      activeStyleMode: "clean",
    });
  }, [file.elements, themeMode]);

  return (
    <Box
      className="neu-inset"
      sx={{
        width: "100%",
        height: 140,
        bgcolor: "var(--neu-bg)",
        boxShadow: "var(--neu-shadow-inset)",
        borderBottom: "var(--neu-border-inset)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        width={320}
        height={160}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
      {activeElements.length === 0 && (
        <Box
          sx={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
            color: "text.secondary",
            opacity: 0.7,
          }}
        >
          <SpaceDashboardOutlined sx={{ fontSize: 28 }} />
          <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
            Blank Canvas
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export function Dashboard({
  user,
  projects,
  currentProject,
  onSelectProject,
  onOpenFile,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onOpenShare,
  onOpenAccountManage,
  onLogout,
  initialFolderId,
  onFolderChange,
  themePreference = "system",
  onThemeChange,
  themeMode,
  onToggleTheme,
}: DashboardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDark = themeMode === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId || "all",
  );
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [themeAnchorEl, setThemeAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (initialFolderId) {
      setSelectedFolderId(initialFolderId);
    }
  }, [initialFolderId]);

  // Modal dialog states
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string>("");
  const [deleteFileModalOpen, setDeleteFileModalOpen] = useState(false);

  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [renameFileModalOpen, setRenameFileModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<{
    project: Project;
    file: WhiteboardDocument;
  } | null>(null);

  // Context Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedFileForMenu, setSelectedFileForMenu] = useState<{
    project: Project;
    file: WhiteboardDocument;
  } | null>(null);

  // Filter projects and files
  const filteredProjects = projects.filter((p) => {
    if (selectedFolderId === "all") return true;
    return p.id === selectedFolderId;
  });

  const allFilesWithProject: { project: Project; file: WhiteboardDocument }[] =
    [];
  for (const proj of filteredProjects) {
    if (proj.files) {
      for (const f of proj.files) {
        if (
          !searchQuery.trim() ||
          f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proj.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          allFilesWithProject.push({ project: proj, file: f });
        }
      }
    }
  }

  // GSAP Animation Refs
  const topNavbarRef = useRef<HTMLDivElement | null>(null);
  const welcomeBannerRef = useRef<HTMLDivElement | null>(null);
  const templatesGridRef = useRef<HTMLDivElement | null>(null);
  const filesGridRef = useRef<HTMLDivElement | null>(null);
  const sidebarProjectsRef = useRef<HTMLDivElement | null>(null);
  const activeFolderBannerRef = useRef<HTMLDivElement | null>(null);

  // Top navbar entrance animation
  useEffect(() => {
    if (topNavbarRef.current) {
      animateHeaderIn(topNavbarRef.current, { duration: 0.55, y: -22 });
    }
  }, []);

  // Welcome banner entrance animation
  useEffect(() => {
    if (welcomeBannerRef.current) {
      animateStaggerIn(welcomeBannerRef.current, { duration: 0.6, y: 15 });
    }
  }, []);

  // Quick templates staggered cascade
  useEffect(() => {
    if (templatesGridRef.current?.children.length) {
      animateStaggerIn(templatesGridRef.current.children, {
        stagger: 0.05,
        y: 18,
        delay: 0.08,
      });
    }
  }, []);

  // Recent/pinned files staggered entrance whenever folder, query or file count changes
  useEffect(() => {
    if (filesGridRef.current?.children.length) {
      animateStaggerIn(filesGridRef.current.children, {
        stagger: 0.04,
        y: 22,
        scale: 0.96,
      });
    }
  }, [selectedFolderId, searchQuery, allFilesWithProject.length]);

  // Sidebar project folders staggered entrance
  useEffect(() => {
    if (sidebarProjectsRef.current?.children.length) {
      animateStaggerIn(sidebarProjectsRef.current.children, {
        stagger: 0.03,
        y: 12,
        scale: 0.98,
      });
    }
  }, [projects.length]);

  // Active folder details banner entrance
  useEffect(() => {
    if (activeFolderBannerRef.current) {
      animateStaggerIn(activeFolderBannerRef.current, {
        duration: 0.45,
        y: 12,
        scale: 0.98,
      });
    }
  }, [selectedFolderId]);

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        bgcolor: "var(--neu-bg)",
        color: "var(--neu-text-primary)",
        display: "flex",
        overflow: "hidden",
        transition: "all 0.25s ease",
      }}
    >
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <Box
          onClick={() => setSidebarOpen(false)}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 1100,
          }}
        />
      )}

      {/* Figma-Style Left Sidebar */}
      <Box
        className="neu-flat"
        sx={{
          position: { xs: "fixed", md: "relative" },
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          transform: {
            xs: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            md: "none",
          },
          height: "100%",
          bgcolor: "var(--neu-surface)",
          borderRight: "var(--neu-border)",
          boxShadow: "var(--neu-shadow-raised)",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          flexShrink: 0,
          zIndex: { xs: 1200, md: 30 },
        }}
      >
        {/* Brand Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "var(--neu-border-subtle)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "var(--neu-shadow-btn), 0 4px 12px var(--neu-primary-glow)",
              }}
            >
              <SailingOutlined sx={{ fontSize: 20, color: "#ffffff" }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.2 }}
              >
                Sailboard
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--neu-text-secondary)", fontSize: "0.65rem" }}
              >
                Engineering Canvas
              </Typography>
            </Box>
          </Box>
          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setSidebarOpen(false)}
              className="neu-icon-btn"
            >
              <MenuOpenOutlined
                fontSize="small"
                sx={{ transform: "rotate(180deg)" }}
              />
            </IconButton>
          )}
        </Box>

        {/* User Profile Card */}
        {user && (
          <Tooltip title="Manage Account & Switch Profiles">
            <Box
              className="neu-inset"
              onClick={onOpenAccountManage}
              sx={{
                p: 1.4,
                m: 1.5,
                borderRadius: "12px",
                bgcolor: "var(--neu-bg)",
                boxShadow: "var(--neu-shadow-inset)",
                border: "var(--neu-border-inset)",
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                cursor: onOpenAccountManage ? "pointer" : "default",
                transition: "all 0.2s ease",
                "&:hover": onOpenAccountManage
                  ? {
                      borderColor: "var(--neu-primary)",
                      boxShadow:
                        "var(--neu-shadow-pressed), 0 0 0 1px var(--neu-primary)",
                    }
                  : {},
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: user.color || "#6366f1",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  boxShadow: "var(--neu-shadow-btn)",
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ overflow: "hidden", flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, lineHeight: 1.2 }}
                  noWrap
                >
                  {user.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.72rem",
                  }}
                  noWrap
                >
                  {user.email}
                </Typography>
              </Box>
              {onOpenAccountManage && (
                <IconButton
                  size="small"
                  className="neu-icon-btn"
                  sx={{
                    width: 28,
                    height: 28,
                    color: "var(--neu-text-secondary)",
                    flexShrink: 0,
                  }}
                >
                  <ManageAccountsOutlined sx={{ fontSize: 17 }} />
                </IconButton>
              )}
            </Box>
          </Tooltip>
        )}

        {/* Navigation Section */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              px: 1,
              fontWeight: 700,
              color: "text.secondary",
              letterSpacing: 0.5,
            }}
          >
            WORKSPACE
          </Typography>

          <Button
            fullWidth
            size="small"
            startIcon={<SpaceDashboardOutlined fontSize="small" />}
            onClick={() => {
              setSelectedFolderId("all");
              onFolderChange?.("all");
              if (isMobile) setSidebarOpen(false);
            }}
            sx={{
              justifyContent: "flex-start",
              px: 1.4,
              py: 0.9,
              my: 0.4,
              borderRadius: "10px",
              fontWeight: selectedFolderId === "all" ? 700 : 500,
              bgcolor:
                selectedFolderId === "all" ? "var(--neu-bg)" : "transparent",
              boxShadow:
                selectedFolderId === "all"
                  ? "var(--neu-shadow-pressed)"
                  : "none",
              border:
                selectedFolderId === "all"
                  ? "var(--neu-border-inset)"
                  : "1px solid transparent",
              color:
                selectedFolderId === "all"
                  ? "var(--neu-primary-light)"
                  : "inherit",
              "&:hover": {
                bgcolor:
                  selectedFolderId === "all"
                    ? "var(--neu-bg)"
                    : "var(--neu-surface-hover)",
              },
            }}
          >
            All Canvases & Files
          </Button>

          <Divider sx={{ my: 1.5, borderColor: "var(--neu-border-subtle)" }} />

          {/* Project Folders Header with "+ New Folder" */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              mb: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "var(--neu-text-secondary)",
                letterSpacing: 0.5,
              }}
            >
              PROJECT FOLDERS ({projects.length})
            </Typography>
            <Tooltip title="Create new project folder">
              <IconButton
                size="small"
                onClick={() => setNewProjectOpen(true)}
                className="neu-icon-btn"
                sx={{ p: 0.5, width: 28, height: 28 }}
              >
                <AddOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Project Folders List */}
          <Box ref={sidebarProjectsRef}>
            {projects.map((proj) => {
              const isSelected = selectedFolderId === proj.id;
              const isProjOwner = proj.userRole === "owner";
              const canEditProj =
                proj.userRole === "owner" || proj.userRole === "editor";
              return (
                <Box
                  key={proj.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    my: 0.3,
                    borderRadius: "10px",
                    bgcolor: isSelected ? "var(--neu-bg)" : "transparent",
                    boxShadow: isSelected
                      ? "var(--neu-shadow-pressed)"
                      : "none",
                    border: isSelected
                      ? "var(--neu-border-inset)"
                      : "1px solid transparent",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: isSelected
                        ? "var(--neu-bg)"
                        : "var(--neu-surface-hover)",
                      "& .dash-folder-actions": { opacity: 1 },
                    },
                  }}
                >
                  <Button
                    fullWidth
                    size="small"
                    startIcon={
                      <FolderOutlined
                        fontSize="small"
                        sx={{
                          color: isSelected
                            ? "var(--neu-primary-light)"
                            : "text.secondary",
                        }}
                      />
                    }
                    onClick={() => {
                      setSelectedFolderId(proj.id);
                      onFolderChange?.(proj.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    sx={{
                      justifyContent: "flex-start",
                      px: 1.4,
                      py: 0.8,
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "0.825rem",
                      color: isSelected
                        ? "var(--neu-primary-light)"
                        : "inherit",
                      textTransform: "none",
                      minWidth: 0,
                      flex: 1,
                      textAlign: "left",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.825rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {proj.name}
                    </Typography>
                  </Button>
                  <Box
                    className="dash-folder-actions"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      pr: 0.8,
                      opacity: isSelected ? 1 : 0,
                      transition: "opacity 0.15s ease",
                    }}
                  >
                    {onUpdateProject && canEditProj && (
                      <Tooltip title="Edit folder">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToEdit(proj);
                            setEditProjectModalOpen(true);
                          }}
                          className="neu-icon-btn"
                          sx={{ width: 22, height: 22, p: 0.2 }}
                        >
                          <EditOutlined sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDeleteProject && isProjOwner && (
                      <Tooltip title="Delete folder">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(proj);
                            setDeleteProjectModalOpen(true);
                          }}
                          className="neu-icon-btn"
                          sx={{
                            width: 22,
                            height: 22,
                            p: 0.2,
                            "&:hover": { color: "error.main" },
                          }}
                        >
                          <DeleteOutlined sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Footer Actions: Theme Toggle & Sign Out */}
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Tooltip title={`Theme: ${themePreference || themeMode}`}>
            <IconButton
              size="small"
              onClick={(e) => setThemeAnchorEl(e.currentTarget)}
              sx={{ color: "inherit" }}
            >
              {themePreference === "system" ? (
                <SettingsBrightnessOutlined fontSize="small" />
              ) : isDark ? (
                <DarkModeOutlined fontSize="small" />
              ) : (
                <LightModeOutlined fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={themeAnchorEl}
            open={Boolean(themeAnchorEl)}
            onClose={() => setThemeAnchorEl(null)}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: "12px",
                  bgcolor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                if (onThemeChange) onThemeChange("light");
                else if (isDark) onToggleTheme();
                setThemeAnchorEl(null);
              }}
              selected={themePreference === "light"}
            >
              <ListItemIcon>
                <LightModeOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Light" />
              {themePreference === "light" && (
                <CheckOutlined fontSize="small" sx={{ ml: 1 }} />
              )}
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (onThemeChange) onThemeChange("dark");
                else if (!isDark) onToggleTheme();
                setThemeAnchorEl(null);
              }}
              selected={themePreference === "dark"}
            >
              <ListItemIcon>
                <DarkModeOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Dark" />
              {themePreference === "dark" && (
                <CheckOutlined fontSize="small" sx={{ ml: 1 }} />
              )}
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (onThemeChange) onThemeChange("system");
                setThemeAnchorEl(null);
              }}
              selected={themePreference === "system"}
            >
              <ListItemIcon>
                <SettingsBrightnessOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="System mode" />
              {themePreference === "system" && (
                <CheckOutlined fontSize="small" sx={{ ml: 1 }} />
              )}
            </MenuItem>
          </Menu>
          <Button
            size="small"
            startIcon={<LogoutOutlined fontSize="small" />}
            onClick={onLogout}
            color="error"
            sx={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "none" }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Navbar */}
        <Box
          ref={topNavbarRef}
          className="neu-dock"
          sx={{
            height: 60,
            px: { xs: 2, sm: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "var(--neu-border)",
            bgcolor: "var(--neu-surface)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {isMobile && (
              <IconButton
                size="small"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="neu-icon-btn"
              >
                <MenuOpenOutlined fontSize="small" />
              </IconButton>
            )}

            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search files and projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined
                        fontSize="small"
                        sx={{ color: "var(--neu-text-secondary)" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: { xs: 150, sm: 260, md: 360 },
              }}
            />
          </Box>

          {/* New Canvas File Button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddOutlined />}
              onClick={() => {
                if (projects.length === 0) {
                  toast(
                    "Please create a project folder first to organize your canvases!",
                    { icon: "📁" },
                  );
                  setNewProjectOpen(true);
                  return;
                }
                setTargetProjectId(
                  selectedFolderId !== "all"
                    ? selectedFolderId
                    : projects[0]?.id || "",
                );
                setNewFileOpen(true);
              }}
              className="neu-btn-primary"
              sx={{
                py: { xs: 0.6, sm: 0.9 },
                px: { xs: 1.2, sm: 2.2 },
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                textTransform: "none",
                whiteSpace: "nowrap",
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                New Canvas
              </Box>
              <Box
                component="span"
                sx={{ display: { xs: "inline", sm: "none" } }}
              >
                New
              </Box>
            </Button>
          </Box>
        </Box>

        {/* Dashboard Body */}
        <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, sm: 3.5 } }}>
          {/* Welcome Banner */}
          <Box ref={welcomeBannerRef} sx={{ mb: 3.5 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 0.5 }}
            >
              Welcome back{user?.name ? `, ${user.name}` : ""} 👋
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Jump into your collaborative architecture diagrams, engineering
              canvases, and multi-file project folders.
            </Typography>
          </Box>

          {/* Active Selected Project Folder Details Banner */}
          {selectedFolderId !== "all" &&
            (() => {
              const currentSelectedProj = projects.find(
                (p) => p.id === selectedFolderId,
              );
              if (!currentSelectedProj) return null;
              const isOwner = currentSelectedProj.userRole === "owner";
              const canEdit =
                isOwner || currentSelectedProj.userRole === "editor";

              return (
                <Box
                  ref={activeFolderBannerRef}
                  className="neu-card"
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    mb: 3.5,
                    borderRadius: "16px",
                    bgcolor: "var(--neu-card)",
                    boxShadow: "var(--neu-shadow-raised)",
                    border: "var(--neu-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      minWidth: 200,
                      flex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        background:
                          "linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-light) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        boxShadow: "0 2px 8px var(--neu-primary-glow)",
                        flexShrink: 0,
                      }}
                    >
                      <FolderOutlined />
                    </Box>
                    <Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            fontSize: "1.1rem",
                            color: "var(--neu-text-primary)",
                          }}
                        >
                          {currentSelectedProj.name}
                        </Typography>
                        <Chip
                          label={(
                            currentSelectedProj.userRole || "editor"
                          ).toUpperCase()}
                          size="small"
                          color={
                            isOwner
                              ? "primary"
                              : currentSelectedProj.userRole === "viewer"
                                ? "warning"
                                : currentSelectedProj.userRole === "commenter"
                                  ? "info"
                                  : "success"
                          }
                          sx={{
                            height: 18,
                            fontSize: "0.62rem",
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--neu-text-secondary)",
                          fontSize: "0.8rem",
                        }}
                      >
                        {currentSelectedProj.description ||
                          `${currentSelectedProj.files?.length || 0} canvases in this folder`}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ShareOutlined fontSize="small" />}
                      onClick={() => onOpenShare(currentSelectedProj)}
                      className="neu-btn"
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                      }}
                    >
                      Share & Roles
                    </Button>

                    {onUpdateProject && canEdit && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditOutlined fontSize="small" />}
                        onClick={() => {
                          setProjectToEdit(currentSelectedProj);
                          setEditProjectModalOpen(true);
                        }}
                        className="neu-btn"
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                        }}
                      >
                        Edit Folder
                      </Button>
                    )}

                    {onDeleteProject && isOwner && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlined fontSize="small" />}
                        onClick={() => {
                          setProjectToDelete(currentSelectedProj);
                          setDeleteProjectModalOpen(true);
                        }}
                        className="neu-btn"
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                        }}
                      >
                        Delete Folder
                      </Button>
                    )}
                  </Box>
                </Box>
              );
            })()}

          {/* Zero Projects Onboarding Banner */}
          {projects.length === 0 && (
            <Card
              variant="outlined"
              sx={{
                p: 3,
                mb: 3.5,
                borderRadius: "16px",
                background: isDark
                  ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(56, 189, 248, 0.08) 100%)"
                  : "linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)",
                borderColor: isDark
                  ? "rgba(99, 102, 241, 0.3)"
                  : "rgba(99, 102, 241, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ maxWidth: 620 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  No Project Folders Yet 📁
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Sailboard organizes all your architectural diagrams,
                  whiteboard canvases, and markdown specs into project folders.
                  Create your first folder to begin designing!
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<CreateNewFolderOutlined />}
                onClick={() => setNewProjectOpen(true)}
                sx={{
                  py: 1,
                  px: 2.5,
                  borderRadius: "10px",
                  fontWeight: 700,
                  textTransform: "none",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                }}
              >
                + Create Project Folder
              </Button>
            </Card>
          )}

          {/* Quick Start Templates */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                letterSpacing: 0.5,
                mb: 1.5,
                display: "block",
              }}
            >
              QUICK TEMPLATES & ACTIONS
            </Typography>

            <Box
              ref={templatesGridRef}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2,
              }}
            >
              {/* Blank Canvas */}
              <DashboardCard>
                <CardActionArea
                  onClick={() => {
                    if (projects.length === 0) {
                      toast("Please create a project folder first!", {
                        icon: "📁",
                      });
                      setNewProjectOpen(true);
                      return;
                    }
                    setTargetProjectId(
                      selectedFolderId !== "all"
                        ? selectedFolderId
                        : projects[0]?.id || "",
                    );
                    setNewFileOpen(true);
                  }}
                  sx={{ p: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        bgcolor: "rgba(99, 102, 241, 0.15)",
                        color: "var(--neu-primary-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--neu-shadow-btn)",
                      }}
                    >
                      <AddOutlined fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        + Blank Canvas
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Infinite engineering board
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </DashboardCard>

              {/* System Architecture Template */}
              <DashboardCard>
                <CardActionArea
                  onClick={async () => {
                    if (projects.length === 0) {
                      toast("Please create a project folder first!", {
                        icon: "📁",
                      });
                      setNewProjectOpen(true);
                      return;
                    }
                    const proj =
                      selectedFolderId !== "all"
                        ? projects.find((p) => p.id === selectedFolderId) ||
                          projects[0]
                        : projects[0];
                    if (proj) {
                      try {
                        await onCreateFile(
                          proj.id,
                          "System Architecture Blueprint",
                        );
                        toast.success("Architecture blueprint created!");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to create template");
                      }
                    }
                  }}
                  sx={{ p: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        bgcolor: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--neu-shadow-btn)",
                      }}
                    >
                      <AutoAwesomeOutlined fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Architecture Template
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Microservices & API
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </DashboardCard>

              {/* New Folder */}
              <DashboardCard>
                <CardActionArea
                  onClick={() => setNewProjectOpen(true)}
                  sx={{ p: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        bgcolor: "rgba(236, 72, 153, 0.15)",
                        color: "#ec4899",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--neu-shadow-btn)",
                      }}
                    >
                      <CreateNewFolderOutlined fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        + Project Folder
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Organize multi-file canvas
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </DashboardCard>

              {/* Share & Roles */}
              <DashboardCard>
                <CardActionArea
                  onClick={() => {
                    if (projects.length === 0) {
                      toast(
                        "Create a project folder first to manage permissions!",
                        { icon: "📁" },
                      );
                      setNewProjectOpen(true);
                      return;
                    }
                    const proj =
                      selectedFolderId !== "all"
                        ? projects.find((p) => p.id === selectedFolderId) ||
                          projects[0]
                        : projects[0];
                    if (proj) onOpenShare(proj);
                  }}
                  sx={{ p: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        bgcolor: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--neu-shadow-btn)",
                      }}
                    >
                      <ShareOutlined fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Collaborate & Share
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Manage Editors & Viewers
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </DashboardCard>
            </Box>
          </Box>

          {/* Files Grid (Figma Style) */}
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, fontSize: "1.05rem" }}
              >
                Recent & Pinned Canvases ({allFilesWithProject.length})
              </Typography>
            </Box>

            {allFilesWithProject.length === 0 ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: "center",
                  bgcolor: isDark ? "rgba(30, 41, 59, 0.2)" : "#f1f5f9",
                  borderRadius: "16px",
                  border: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                }}
              >
                <DescriptionOutlined
                  sx={{
                    fontSize: 48,
                    color: "text.secondary",
                    mb: 1,
                    opacity: 0.6,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  No canvases found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Create your first whiteboard file in this project folder.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddOutlined />}
                  onClick={() => {
                    if (projects.length === 0) {
                      toast("Please create a project folder first!", {
                        icon: "📁",
                      });
                      setNewProjectOpen(true);
                      return;
                    }
                    setTargetProjectId(
                      selectedFolderId !== "all"
                        ? selectedFolderId
                        : projects[0]?.id || "",
                    );
                    setNewFileOpen(true);
                  }}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Create Canvas File
                </Button>
              </Box>
            ) : (
              <Box
                ref={filesGridRef}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(auto-fill, minmax(260px, 1fr))",
                    lg: "repeat(auto-fill, minmax(290px, 1fr))",
                  },
                  gap: 2.5,
                }}
              >
                {allFilesWithProject.map(({ project, file }) => (
                  <DashboardCard
                    key={file.id}
                    sx={{
                      borderRadius: "16px",
                      overflow: "hidden",
                    }}
                  >
                    <CardActionArea onClick={() => onOpenFile(project, file)}>
                      <FileThumbnail file={file} themeMode={themeMode} />

                      <CardContent sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, fontSize: "0.92rem" }}
                            noWrap
                          >
                            {file.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFileForMenu({ project, file });
                              setMenuAnchor(e.currentTarget);
                            }}
                            sx={{ p: 0.4 }}
                          >
                            <MoreVertOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <FolderOutlined
                              sx={{ fontSize: 13, color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", fontWeight: 600 }}
                            >
                              {project.name}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            pt: 1,
                            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.7rem" }}
                          >
                            {(() => {
                              const activeCount = file.elements?.filter((e) => !e.isDeleted).length || 0;
                              return `${activeCount} ${activeCount === 1 ? 'shape' : 'shapes'}`;
                            })()}
                          </Typography>

                          <Chip
                            label={(project.userRole || "editor").toUpperCase()}
                            size="small"
                            color={
                              project.userRole === "owner"
                                ? "primary"
                                : project.userRole === "viewer"
                                  ? "warning"
                                  : project.userRole === "commenter"
                                    ? "info"
                                    : "success"
                            }
                            sx={{
                              height: 18,
                              fontSize: "0.62rem",
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </DashboardCard>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* File Action Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              bgcolor: isDark ? "#1e293b" : "#fff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedFileForMenu) {
              onOpenFile(selectedFileForMenu.project, selectedFileForMenu.file);
            }
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <SpaceDashboardOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Open in Canvas" />
        </MenuItem>

        {onRenameFile && (
          <MenuItem
            onClick={() => {
              if (selectedFileForMenu) {
                setFileToRename(selectedFileForMenu);
                setRenameFileModalOpen(true);
              }
              setMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <EditOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Rename Canvas" />
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            if (selectedFileForMenu) {
              onOpenShare(selectedFileForMenu.project);
            }
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <ShareOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Share & Permissions" />
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setDeleteFileModalOpen(true);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete File" />
        </MenuItem>
      </Menu>

      {/* Confirm File Delete Modal */}
      <ConfirmDeleteModal
        open={deleteFileModalOpen}
        title="Delete Canvas File"
        itemType="canvas file"
        itemName={selectedFileForMenu?.file.title}
        onClose={() => setDeleteFileModalOpen(false)}
        onConfirm={async () => {
          if (selectedFileForMenu) {
            await onDeleteFile(
              selectedFileForMenu.project.id,
              selectedFileForMenu.file.id,
            );
            setDeleteFileModalOpen(false);
          }
        }}
      />

      {/* Edit Project Folder Modal */}
      <EditProjectModal
        open={editProjectModalOpen}
        project={projectToEdit}
        onClose={() => {
          setEditProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        onUpdateProject={async (projectId, updates) => {
          if (onUpdateProject) {
            await onUpdateProject(projectId, updates);
          }
        }}
      />

      {/* Confirm Delete Project Folder Modal */}
      <ConfirmDeleteModal
        open={deleteProjectModalOpen}
        title="Delete Project Folder"
        itemType="project folder"
        itemName={projectToDelete?.name}
        warningText="Deleting this folder will permanently delete all whiteboard canvases and architecture notes contained inside it."
        onClose={() => {
          setDeleteProjectModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={async () => {
          if (projectToDelete && onDeleteProject) {
            await onDeleteProject(projectToDelete.id);
            setDeleteProjectModalOpen(false);
            setProjectToDelete(null);
          }
        }}
      />

      {/* Rename Canvas File Modal */}
      <RenameFileModal
        open={renameFileModalOpen}
        initialTitle={fileToRename?.file.title || ""}
        onClose={() => {
          setRenameFileModalOpen(false);
          setFileToRename(null);
        }}
        onRename={async (newTitle) => {
          if (fileToRename && onRenameFile) {
            await onRenameFile(
              fileToRename.project.id,
              fileToRename.file.id,
              newTitle,
            );
          }
        }}
      />

      {/* Create Project Folder Modal */}
      <CreateProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreateProject={onCreateProject}
      />

      {/* Create Canvas File Modal */}
      <CreateFileModal
        open={newFileOpen}
        projects={projects}
        initialProjectId={targetProjectId}
        onClose={() => setNewFileOpen(false)}
        onCreateFile={onCreateFile}
        onCreateProjectClick={() => setNewProjectOpen(true)}
      />
    </Box>
  );
}
