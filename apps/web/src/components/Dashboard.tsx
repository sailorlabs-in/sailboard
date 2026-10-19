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
  SettingsBrightnessOutlined,
  CheckOutlined,
  SailingOutlined,
  MenuOpenOutlined,
  SpaceDashboardOutlined,
  AutoAwesomeOutlined,
} from '@mui/icons-material';
import { Project, WhiteboardDocument, ProjectRole, User } from '@rea/shared-types';
import toast from 'react-hot-toast';
import { renderScene } from '../canvas/renderer';
import { ThemePreference } from '../theme/theme';
import { ConfirmDeleteModal, CreateProjectModal, CreateFileModal } from './modals';

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
  themePreference?: ThemePreference;
  onThemeChange?: (pref: ThemePreference) => void;
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
      className="neu-inset"
      sx={{
        width: '100%',
        height: 140,
        bgcolor: 'var(--neu-bg)',
        boxShadow: 'var(--neu-shadow-inset)',
        borderBottom: 'var(--neu-border-inset)',
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
  themePreference = 'system',
  onThemeChange,
  themeMode,
  onToggleTheme,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = themeMode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all'); // 'all' or specific projectId
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [themeAnchorEl, setThemeAnchorEl] = useState<null | HTMLElement>(null);

  // Modal dialog states
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [deleteFileModalOpen, setDeleteFileModalOpen] = useState(false);

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

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        bgcolor: 'var(--neu-bg)',
        color: 'var(--neu-text-primary)',
        display: 'flex',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Figma-Style Left Sidebar */}
      <Box
        className="neu-flat"
        sx={{
          width: { xs: sidebarOpen ? 260 : 0, md: 260 },
          height: '100%',
          bgcolor: 'var(--neu-surface)',
          borderRight: 'var(--neu-border)',
          boxShadow: 'var(--neu-shadow-raised)',
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
            borderBottom: 'var(--neu-border-subtle)',
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
                boxShadow: 'var(--neu-shadow-btn), 0 4px 12px var(--neu-primary-glow)',
              }}
            >
              <SailingOutlined sx={{ fontSize: 20, color: '#ffffff' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.2 }}>
                Sailboard
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.65rem' }}>
                Engineering Canvas
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* User Profile Card */}
        {user && (
          <Box
            className="neu-inset"
            sx={{
              p: 1.6,
              m: 1.5,
              borderRadius: '12px',
              bgcolor: 'var(--neu-bg)',
              boxShadow: 'var(--neu-shadow-inset)',
              border: 'var(--neu-border-inset)',
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
              px: 1.4,
              py: 0.9,
              my: 0.4,
              borderRadius: '10px',
              fontWeight: selectedFolderId === 'all' ? 700 : 500,
              bgcolor: selectedFolderId === 'all' ? 'var(--neu-bg)' : 'transparent',
              boxShadow: selectedFolderId === 'all' ? 'var(--neu-shadow-pressed)' : 'none',
              border: selectedFolderId === 'all' ? 'var(--neu-border-inset)' : '1px solid transparent',
              color: selectedFolderId === 'all' ? 'var(--neu-primary-light)' : 'inherit',
              '&:hover': { bgcolor: selectedFolderId === 'all' ? 'var(--neu-bg)' : 'var(--neu-surface-hover)' },
            }}
          >
            All Canvases & Files
          </Button>

          <Divider sx={{ my: 1.5, borderColor: 'var(--neu-border-subtle)' }} />

          {/* Project Folders Header with "+ New Folder" */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--neu-text-secondary)', letterSpacing: 0.5 }}>
              PROJECT FOLDERS ({projects.length})
            </Typography>
            <Tooltip title="Create new project folder">
              <IconButton size="small" onClick={() => setNewProjectOpen(true)} className="neu-icon-btn" sx={{ p: 0.5, width: 28, height: 28 }}>
                <AddOutlined sx={{ fontSize: 16 }} />
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
                startIcon={<FolderOutlined fontSize="small" sx={{ color: isSelected ? 'var(--neu-primary-light)' : 'text.secondary' }} />}
                onClick={() => setSelectedFolderId(proj.id)}
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.4,
                  py: 0.8,
                  my: 0.3,
                  borderRadius: '10px',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.825rem',
                  bgcolor: isSelected ? 'var(--neu-bg)' : 'transparent',
                  boxShadow: isSelected ? 'var(--neu-shadow-pressed)' : 'none',
                  border: isSelected ? 'var(--neu-border-inset)' : '1px solid transparent',
                  color: isSelected ? 'var(--neu-primary-light)' : 'inherit',
                  '&:hover': { bgcolor: isSelected ? 'var(--neu-bg)' : 'var(--neu-surface-hover)' },
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
          <Tooltip title={`Theme: ${themePreference || themeMode}`}>
            <IconButton
              size="small"
              onClick={(e) => setThemeAnchorEl(e.currentTarget)}
              sx={{ color: 'inherit' }}
            >
              {themePreference === 'system' ? (
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
                  borderRadius: '12px',
                  bgcolor: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                if (onThemeChange) onThemeChange('light');
                else if (isDark) onToggleTheme();
                setThemeAnchorEl(null);
              }}
              selected={themePreference === 'light'}
            >
              <ListItemIcon>
                <LightModeOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Light" />
              {themePreference === 'light' && <CheckOutlined fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (onThemeChange) onThemeChange('dark');
                else if (!isDark) onToggleTheme();
                setThemeAnchorEl(null);
              }}
              selected={themePreference === 'dark'}
            >
              <ListItemIcon>
                <DarkModeOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Dark" />
              {themePreference === 'dark' && <CheckOutlined fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (onThemeChange) onThemeChange('system');
                setThemeAnchorEl(null);
              }}
              selected={themePreference === 'system'}
            >
              <ListItemIcon>
                <SettingsBrightnessOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="System mode" />
              {themePreference === 'system' && <CheckOutlined fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
          </Menu>

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
          className="neu-dock"
          sx={{
            height: 60,
            px: { xs: 2, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 'var(--neu-border)',
            bgcolor: 'var(--neu-surface)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMobile && (
              <IconButton size="small" onClick={() => setSidebarOpen((prev) => !prev)} className="neu-icon-btn">
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
                      <SearchOutlined fontSize="small" sx={{ color: 'var(--neu-text-secondary)' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: { xs: 200, sm: 300, md: 360 },
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
                if (projects.length === 0) {
                  toast('Please create a project folder first to organize your canvases!', { icon: '📁' });
                  setNewProjectOpen(true);
                  return;
                }
                setTargetProjectId(selectedFolderId !== 'all' ? selectedFolderId : projects[0]?.id || '');
                setNewFileOpen(true);
              }}
              className="neu-btn-primary"
              sx={{
                py: 0.9,
                px: 2.2,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
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

          {/* Zero Projects Onboarding Banner */}
          {projects.length === 0 && (
            <Card
              variant="outlined"
              sx={{
                p: 3,
                mb: 3.5,
                borderRadius: '16px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(56, 189, 248, 0.08) 100%)'
                  : 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ maxWidth: 620 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  No Project Folders Yet 📁
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sailboard organizes all your architectural diagrams, whiteboard canvases, and markdown specs into project folders. Create your first folder to begin designing!
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<CreateNewFolderOutlined />}
                onClick={() => setNewProjectOpen(true)}
                sx={{
                  py: 1,
                  px: 2.5,
                  borderRadius: '10px',
                  fontWeight: 700,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                }}
              >
                + Create Project Folder
              </Button>
            </Card>
          )}

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
                className="neu-card"
                sx={{
                  borderRadius: '16px',
                  bgcolor: 'var(--neu-card)',
                  boxShadow: 'var(--neu-shadow-raised)',
                  border: 'var(--neu-border)',
                }}
              >
                <CardActionArea
                  onClick={() => {
                    if (projects.length === 0) {
                      toast('Please create a project folder first!', { icon: '📁' });
                      setNewProjectOpen(true);
                      return;
                    }
                    setTargetProjectId(selectedFolderId !== 'all' ? selectedFolderId : projects[0]?.id || '');
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
                        color: 'var(--neu-primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--neu-shadow-btn)',
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
                className="neu-card"
                sx={{
                  borderRadius: '16px',
                  bgcolor: 'var(--neu-card)',
                  boxShadow: 'var(--neu-shadow-raised)',
                  border: 'var(--neu-border)',
                }}
              >
                <CardActionArea
                  onClick={async () => {
                    if (projects.length === 0) {
                      toast('Please create a project folder first!', { icon: '📁' });
                      setNewProjectOpen(true);
                      return;
                    }
                    const proj = selectedFolderId !== 'all' ? projects.find((p) => p.id === selectedFolderId) || projects[0] : projects[0];
                    if (proj) {
                      try {
                        await onCreateFile(proj.id, 'System Architecture Blueprint');
                        toast.success('Architecture blueprint created!');
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to create template');
                      }
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
                        boxShadow: 'var(--neu-shadow-btn)',
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
                className="neu-card"
                sx={{
                  borderRadius: '16px',
                  bgcolor: 'var(--neu-card)',
                  boxShadow: 'var(--neu-shadow-raised)',
                  border: 'var(--neu-border)',
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
                        boxShadow: 'var(--neu-shadow-btn)',
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
                className="neu-card"
                sx={{
                  borderRadius: '16px',
                  bgcolor: 'var(--neu-card)',
                  boxShadow: 'var(--neu-shadow-raised)',
                  border: 'var(--neu-border)',
                }}
              >
                <CardActionArea
                  onClick={() => {
                    if (projects.length === 0) {
                      toast('Create a project folder first to manage permissions!', { icon: '📁' });
                      setNewProjectOpen(true);
                      return;
                    }
                    const proj = selectedFolderId !== 'all' ? projects.find((p) => p.id === selectedFolderId) || projects[0] : projects[0];
                    if (proj) onOpenShare(proj);
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
                        boxShadow: 'var(--neu-shadow-btn)',
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
                    if (projects.length === 0) {
                      toast('Please create a project folder first!', { icon: '📁' });
                      setNewProjectOpen(true);
                      return;
                    }
                    setTargetProjectId(selectedFolderId !== 'all' ? selectedFolderId : projects[0]?.id || '');
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
                    className="neu-card"
                    sx={{
                      borderRadius: '16px',
                      bgcolor: 'var(--neu-card)',
                      boxShadow: 'var(--neu-shadow-raised)',
                      border: 'var(--neu-border)',
                      overflow: 'hidden',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
          onClick={() => {
            setMenuAnchor(null);
            setDeleteFileModalOpen(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
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
            await onDeleteFile(selectedFileForMenu.project.id, selectedFileForMenu.file.id);
            setDeleteFileModalOpen(false);
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
};
