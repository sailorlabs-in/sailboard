import React, { useState, useEffect, useRef } from 'react';
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
  Avatar,
  AvatarGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  SearchOutlined,
  AddOutlined,
  FolderOutlined,
  DescriptionOutlined,
  MoreVertOutlined,
  ShareOutlined,
  DeleteOutlined,
  CreateNewFolderOutlined,
  GridViewOutlined,
  ViewListOutlined,
  AccessTimeOutlined,
  GroupOutlined,
  LogoutOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  MenuOpenOutlined,
  SpaceDashboardOutlined,
  AutoAwesomeOutlined,
} from '@mui/icons-material';
import { Project, WhiteboardDocument, ProjectRole, User } from '@rea/shared-types';
import { renderScene } from '../canvas/renderer';

interface DashboardProps {
  user: User | null;
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (projectId: string) => void;
  onOpenFile: (project: Project, file: WhiteboardDocument) => void;
  onCreateProject: (name: string, description?: string) => Promise<void>;
  onCreateFile: (projectId: string, title: string) => Promise<void>;
  onDeleteFile: (projectId: string, fileId: string) => Promise<void>;
  onOpenShare: (project: Project) => void;
  onLogout: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

// Mini Canvas Thumbnail Preview for Figma File Cards
const FileThumbnail: React.FC<{
  file: WhiteboardDocument;
  themeMode: 'light' | 'dark';
}> = ({ file, themeMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Render scaled mini preview
    renderScene(canvas, file.elements || [], {
      theme: themeMode,
      gridVisible: true,
      gridType: 'dots',
      zoom: 0.18,
      pan: { x: 30, y: 25 },
      selectedElementIds: [],
      selectionBox: null,
      remoteUsers: [],
      activeStyleMode: 'clean',
    });
  }, [file.elements, themeMode]);

  return (
    <Box
      sx={{
        width: '100%',
        height: 140,
        bgcolor: themeMode === 'dark' ? '#0d111c' : '#f1f5f9',
        borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        width={320}
        height={160}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
        }}
      />
      {(!file.elements || file.elements.length === 0) && (
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
            opacity: 0.7,
          }}
        >
          <SpaceDashboardOutlined sx={{ fontSize: 28 }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            Blank Canvas
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  projects,
  currentProject,
  onSelectProject,
  onOpenFile,
  onCreateProject,
  onCreateFile,
  onDeleteFile,
  onOpenShare,
  onLogout,
  themeMode,
  onToggleTheme,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = themeMode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all'); // 'all' or specific projectId
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // New Project Dialog
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // New File Dialog
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [creatingFile, setCreatingFile] = useState(false);

  // Context Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedFileForMenu, setSelectedFileForMenu] = useState<{
    project: Project;
    file: WhiteboardDocument;
  } | null>(null);

  // Filter projects and files
  const filteredProjects = projects.filter((p) => {
    if (selectedFolderId === 'all') return true;
    return p.id === selectedFolderId;
  });

  const allFilesWithProject: { project: Project; file: WhiteboardDocument }[] = [];
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

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      await onCreateProject(newProjectName.trim(), newProjectDesc.trim());
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectOpen(false);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileTitle.trim()) return;
    const projId = targetProjectId || projects[0]?.id;
    if (!projId) return;

    setCreatingFile(true);
    try {
      await onCreateFile(projId, newFileTitle.trim());
      setNewFileTitle('');
      setNewFileOpen(false);
    } finally {
      setCreatingFile(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        bgcolor: isDark ? '#0b0f19' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Figma-Style Left Sidebar */}
      <Box
        sx={{
          width: { xs: sidebarOpen ? 260 : 0, md: 260 },
          height: '100%',
          bgcolor: isDark ? '#111827' : '#ffffff',
          borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {/* Brand Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                fontSize: '1.1rem',
              }}
            >
              ⛵
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.2 }}>
                Sailboard
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                Engineering Canvas
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* User Profile Card */}
        {user && (
          <Box
            sx={{
              p: 1.8,
              m: 1.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: user.color || '#6366f1',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }} noWrap>
                {user.email}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Navigation Section */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
          <Typography variant="caption" sx={{ px: 1, fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
            WORKSPACE
          </Typography>

          <Button
            fullWidth
            size="small"
            startIcon={<SpaceDashboardOutlined fontSize="small" />}
            onClick={() => setSelectedFolderId('all')}
            sx={{
              justifyContent: 'flex-start',
              px: 1.2,
              py: 0.8,
              my: 0.4,
              borderRadius: '8px',
              fontWeight: selectedFolderId === 'all' ? 700 : 500,
              bgcolor: selectedFolderId === 'all' ? (isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)') : 'transparent',
              color: selectedFolderId === 'all' ? '#818cf8' : 'inherit',
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            }}
          >
            All Canvases & Files
          </Button>

          <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

          {/* Project Folders Header with "+ New Folder" */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
              PROJECT FOLDERS ({projects.length})
            </Typography>
            <Tooltip title="Create new project folder">
              <IconButton size="small" onClick={() => setNewProjectOpen(true)} sx={{ p: 0.3, color: 'primary.main' }}>
                <AddOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Project Folders List */}
          {projects.map((proj) => {
            const isSelected = selectedFolderId === proj.id;
            return (
              <Button
                key={proj.id}
                fullWidth
                size="small"
                startIcon={<FolderOutlined fontSize="small" sx={{ color: isSelected ? '#818cf8' : 'text.secondary' }} />}
                onClick={() => setSelectedFolderId(proj.id)}
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.2,
                  py: 0.7,
                  my: 0.3,
                  borderRadius: '8px',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.825rem',
                  bgcolor: isSelected ? (isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)') : 'transparent',
                  color: isSelected ? '#818cf8' : 'inherit',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.825rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {proj.name}
                </Typography>
              </Button>
            );
          })}
        </Box>

        {/* Footer Actions: Theme Toggle & Sign Out */}
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton size="small" onClick={onToggleTheme} sx={{ color: 'inherit' }}>
              {isDark ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Button
            size="small"
            startIcon={<LogoutOutlined fontSize="small" />}
            onClick={onLogout}
            color="error"
            sx={{ fontSize: '0.75rem', fontWeight: 600 }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Navbar */}
        <Box
          sx={{
            height: 60,
            px: { xs: 2, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            bgcolor: isDark ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMobile && (
              <IconButton size="small" onClick={() => setSidebarOpen((prev) => !prev)}>
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
                      <SearchOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: { xs: 200, sm: 300, md: 360 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                  '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
              }}
            />
          </Box>

          {/* New Canvas File Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddOutlined />}
              onClick={() => {
                setTargetProjectId(projects[0]?.id || '');
                setNewFileOpen(true);
              }}
              sx={{
                py: 0.8,
                px: 2,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              }}
            >
              New Canvas
            </Button>
          </Box>
        </Box>

        {/* Dashboard Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3.5 } }}>
          {/* Welcome Banner */}
          <Box sx={{ mb: 3.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 0.5 }}>
              Welcome back{user?.name ? `, ${user.name}` : ''} 👋
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Jump into your collaborative architecture diagrams, engineering canvases, and multi-file project folders.
            </Typography>
          </Box>

          {/* Quick Start Templates */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
              QUICK TEMPLATES & ACTIONS
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              {/* Blank Canvas */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' },
                }}
              >
                <CardActionArea
                  onClick={() => {
                    setTargetProjectId(projects[0]?.id || '');
                    setNewFileOpen(true);
                  }}
                  sx={{ p: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor: 'rgba(99, 102, 241, 0.15)',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
              </Card>

              {/* System Architecture Template */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' },
                }}
              >
                <CardActionArea
                  onClick={async () => {
                    const proj = projects[0];
                    if (proj) {
                      await onCreateFile(proj.id, 'System Architecture Blueprint');
                    }
                  }}
                  sx={{ p: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
              </Card>

              {/* New Folder */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' },
                }}
              >
                <CardActionArea onClick={() => setNewProjectOpen(true)} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor: 'rgba(236, 72, 153, 0.15)',
                        color: '#ec4899',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
              </Card>

              {/* Share & Roles */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' },
                }}
              >
                <CardActionArea
                  onClick={() => {
                    if (projects.length > 0) onOpenShare(projects[0]);
                  }}
                  sx={{ p: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
              </Card>
            </Box>
          </Box>

          {/* Files Grid (Figma Style) */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                Recent & Pinned Canvases ({allFilesWithProject.length})
              </Typography>
            </Box>

            {allFilesWithProject.length === 0 ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: 'center',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.2)' : '#f1f5f9',
                  borderRadius: '16px',
                  border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                }}
              >
                <DescriptionOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.6 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  No canvases found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create your first whiteboard file in this project folder.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddOutlined />}
                  onClick={() => {
                    setTargetProjectId(projects[0]?.id || '');
                    setNewFileOpen(true);
                  }}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                >
                  Create Canvas File
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(auto-fill, minmax(260px, 1fr))',
                    lg: 'repeat(auto-fill, minmax(290px, 1fr))',
                  },
                  gap: 2.5,
                }}
              >
                {allFilesWithProject.map(({ project, file }) => (
                  <Card
                    key={file.id}
                    variant="outlined"
                    sx={{
                      borderRadius: '16px',
                      bgcolor: isDark ? '#1a2234' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: isDark
                          ? '0 12px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.4)'
                          : '0 12px 28px rgba(0,0,0,0.1), 0 0 0 1px rgba(99,102,241,0.3)',
                      },
                    }}
                  >
                    <CardActionArea onClick={() => onOpenFile(project, file)}>
                      <FileThumbnail file={file} themeMode={themeMode} />

                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.92rem' }} noWrap>
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

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FolderOutlined sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              {project.name}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {file.elements?.length || 0} objects
                          </Typography>

                          <Chip
                            label={(project.userRole || 'editor').toUpperCase()}
                            size="small"
                            color={project.userRole === 'owner' ? 'primary' : project.userRole === 'viewer' ? 'warning' : 'success'}
                            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }}
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
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
              borderRadius: '12px',
              bgcolor: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
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
          onClick={async () => {
            if (selectedFileForMenu) {
              if (window.confirm(`Delete "${selectedFileForMenu.file.title}"?`)) {
                await onDeleteFile(selectedFileForMenu.project.id, selectedFileForMenu.file.id);
              }
            }
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete File" />
        </MenuItem>
      </Menu>

      {/* New Project Dialog */}
      <Dialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              bgcolor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create Project Folder</DialogTitle>
        <Box component="form" onSubmit={handleCreateProjectSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              label="Folder Name"
              placeholder="e.g. Core System Architecture"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Description (optional)"
              placeholder="e.g. Microservices, DB schema & API blueprints"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setNewProjectOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creatingProject || !newProjectName.trim()}>
              {creatingProject ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* New File Dialog */}
      <Dialog
        open={newFileOpen}
        onClose={() => setNewFileOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              bgcolor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Canvas File</DialogTitle>
        <Box component="form" onSubmit={handleCreateFileSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              label="File Title"
              placeholder="e.g. File D - Kubernetes Cluster Topology"
              value={newFileTitle}
              onChange={(e) => setNewFileTitle(e.target.value)}
              required
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setNewFileOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creatingFile || !newFileTitle.trim()}>
              {creatingFile ? 'Creating...' : 'Create Canvas'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
