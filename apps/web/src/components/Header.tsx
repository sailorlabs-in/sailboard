import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  ButtonGroup,
  Box,
  Tooltip,
  Avatar,
  AvatarGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Badge,
} from '@mui/material';
import {
  BrushOutlined,
  ArchitectureOutlined,
  ViewSidebarOutlined,
  SpaceDashboardOutlined,
  DescriptionOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  DownloadOutlined,
  UploadFileOutlined,
  GridOnOutlined,
  GrainOutlined,
  CropFreeOutlined,
  CheckOutlined,
  FitScreenOutlined,
  ShareOutlined,
  FolderOutlined,
  MenuOpenOutlined,
  AccountCircleOutlined,
} from '@mui/icons-material';
import { UserPresence, ProjectRole, User } from '@rea/shared-types';

interface HeaderProps {
  projectName: string;
  userRole: ProjectRole;
  title: string;
  onTitleChange: (newTitle: string) => void;
  viewMode: 'canvas' | 'split' | 'notes';
  onViewModeChange: (mode: 'canvas' | 'split' | 'notes') => void;
  styleMode: 'rough' | 'clean';
  onStyleModeChange: (mode: 'rough' | 'clean') => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  gridVisible: boolean;
  onGridVisibleToggle: () => void;
  gridSnap: boolean;
  onGridSnapToggle: () => void;
  gridType: 'dots' | 'grid' | 'blank';
  onGridTypeChange: (type: 'dots' | 'grid' | 'blank') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomToFit: () => void;
  onExportClick: () => void;
  onImportClick: () => void;
  remoteUsers: UserPresence[];
  saveStatus: 'saved' | 'saving' | 'synced';
  onOpenShare: () => void;
  onOpenAuth: () => void;
  currentUser: User | null;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName = 'Sailboard Project',
  userRole = 'editor',
  title,
  onTitleChange,
  viewMode,
  onViewModeChange,
  styleMode,
  onStyleModeChange,
  theme,
  onThemeToggle,
  gridVisible,
  onGridVisibleToggle,
  gridSnap,
  onGridSnapToggle,
  gridType,
  onGridTypeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomToFit,
  onExportClick,
  onImportClick,
  remoteUsers = [],
  saveStatus,
  onOpenShare,
  onOpenAuth,
  currentUser,
  onToggleSidebar,
}) => {
  const [gridMenuAnchor, setGridMenuAnchor] = useState<null | HTMLElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const safeRole: ProjectRole = userRole || 'editor';
  const isDark = theme === 'dark';
  const isViewer = safeRole === 'viewer';

  const handleFinishTitleEdit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        color: isDark ? '#f8fafc' : '#0f172a',
        zIndex: 50,
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 52, px: 1.5, display: 'flex', gap: 1 }}>
        {/* Toggle Folder Sidebar */}
        {onToggleSidebar && (
          <Tooltip title="Toggle Project Folder Explorer">
            <IconButton size="small" onClick={onToggleSidebar} sx={{ color: 'inherit', mr: 0.5 }}>
              <MenuOpenOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Sailboard Logo & Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mr: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
              fontSize: '1rem',
            }}
          >
            ⛵
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.2 }}>
              Sailboard
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.65rem' }}>
              Collaborative Canvas
            </Typography>
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5 }} />

        {/* Project Breadcrumb & Active File Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200, maxWidth: 380 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FolderOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {projectName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              /
            </Typography>
          </Box>

          {isEditingTitle && !isViewer ? (
            <input
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleFinishTitleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishTitleEdit();
                if (e.key === 'Escape') {
                  setTempTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              style={{
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isDark ? '#f8fafc' : '#0f172a',
                background: isDark ? '#1e293b' : '#f1f5f9',
                border: '1px solid #6366f1',
                borderRadius: 4,
                padding: '2px 6px',
                outline: 'none',
              }}
            />
          ) : (
            <Box
              onClick={() => {
                if (!isViewer) {
                  setTempTitle(title);
                  setIsEditingTitle(true);
                }
              }}
              sx={{
                cursor: isViewer ? 'default' : 'pointer',
                px: 0.8,
                py: 0.3,
                borderRadius: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: isViewer ? 'transparent' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }} noWrap>
                {title}
              </Typography>
            </Box>
          )}

          {/* User Role Badge */}
          <Chip
            size="small"
            label={safeRole.toUpperCase()}
            color={safeRole === 'owner' ? 'primary' : safeRole === 'editor' ? 'success' : 'warning'}
            variant="filled"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 700,
              '& .MuiChip-label': { px: 0.6 },
            }}
          />

          <Chip
            size="small"
            label={saveStatus === 'saving' ? 'Saving...' : 'Synced'}
            color={saveStatus === 'saving' ? 'warning' : 'success'}
            variant="outlined"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              '& .MuiChip-label': { px: 0.6 },
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* View Mode Selector (Eraser Dual Split, Excalidraw Canvas, Notes) */}
        <ButtonGroup size="small" variant="outlined" sx={{ mr: 1 }}>
          <Tooltip title="Split View: Eraser Docs + Canvas">
            <Button
              variant={viewMode === 'split' ? 'contained' : 'outlined'}
              onClick={() => onViewModeChange('split')}
              startIcon={<ViewSidebarOutlined />}
              sx={{ px: 1.2, py: 0.4, fontSize: '0.72rem' }}
            >
              Split
            </Button>
          </Tooltip>
          <Tooltip title="Canvas Only (Excalidraw Whiteboard)">
            <Button
              variant={viewMode === 'canvas' ? 'contained' : 'outlined'}
              onClick={() => onViewModeChange('canvas')}
              startIcon={<SpaceDashboardOutlined />}
              sx={{ px: 1.2, py: 0.4, fontSize: '0.72rem' }}
            >
              Canvas
            </Button>
          </Tooltip>
          <Tooltip title="Notes Only (Markdown Docs)">
            <Button
              variant={viewMode === 'notes' ? 'contained' : 'outlined'}
              onClick={() => onViewModeChange('notes')}
              startIcon={<DescriptionOutlined />}
              sx={{ px: 1.2, py: 0.4, fontSize: '0.72rem' }}
            >
              Notes
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Style Mode (Rough vs Clean Architectural) */}
        <ButtonGroup size="small" variant="outlined" sx={{ mr: 1 }}>
          <Tooltip title="Hand-drawn Rough.js Style (Excalidraw)">
            <Button
              variant={styleMode === 'rough' ? 'contained' : 'outlined'}
              color="secondary"
              onClick={() => onStyleModeChange('rough')}
              startIcon={<BrushOutlined />}
              sx={{ px: 1, py: 0.4, fontSize: '0.72rem' }}
            >
              Sketch
            </Button>
          </Tooltip>
          <Tooltip title="Clean Architectural Geometric Mode">
            <Button
              variant={styleMode === 'clean' ? 'contained' : 'outlined'}
              color="secondary"
              onClick={() => onStyleModeChange('clean')}
              startIcon={<ArchitectureOutlined />}
              sx={{ px: 1, py: 0.4, fontSize: '0.72rem' }}
            >
              Clean
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Undo / Redo */}
        {!isViewer && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton size="small" onClick={onUndo} disabled={!canUndo} sx={{ color: 'inherit' }}>
                  <UndoOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton size="small" onClick={onRedo} disabled={!canRedo} sx={{ color: 'inherit' }}>
                  <RedoOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, mr: 1 }}>
          <Tooltip title="Zoom Out (-)">
            <IconButton size="small" onClick={onZoomOut} sx={{ color: 'inherit' }}>
              <ZoomOutOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Click to Reset Zoom (100%)">
            <Typography
              variant="caption"
              onClick={onZoomReset}
              sx={{
                cursor: 'pointer',
                px: 0.8,
                py: 0.2,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.72rem',
                minWidth: 42,
                textAlign: 'center',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              }}
            >
              {Math.round(zoom * 100)}%
            </Typography>
          </Tooltip>
          <Tooltip title="Zoom In (+)">
            <IconButton size="small" onClick={onZoomIn} sx={{ color: 'inherit' }}>
              <ZoomInOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom to Fit">
            <IconButton size="small" onClick={onZoomToFit} sx={{ color: 'inherit' }}>
              <FitScreenOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Grid Settings */}
        <Tooltip title="Grid & Snapping Settings">
          <IconButton
            size="small"
            onClick={(e) => setGridMenuAnchor(e.currentTarget)}
            color={gridVisible ? 'primary' : 'inherit'}
          >
            {gridType === 'dots' ? <GrainOutlined fontSize="small" /> : <GridOnOutlined fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={gridMenuAnchor}
          open={Boolean(gridMenuAnchor)}
          onClose={() => setGridMenuAnchor(null)}
          PaperProps={{
            sx: {
              bgcolor: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              onGridTypeChange('dots');
              if (!gridVisible) onGridVisibleToggle();
              setGridMenuAnchor(null);
            }}
          >
            <ListItemIcon>{gridType === 'dots' && gridVisible ? <CheckOutlined fontSize="small" /> : <GrainOutlined fontSize="small" />}</ListItemIcon>
            <ListItemText primary="Dot Grid" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onGridTypeChange('grid');
              if (!gridVisible) onGridVisibleToggle();
              setGridMenuAnchor(null);
            }}
          >
            <ListItemIcon>{gridType === 'grid' && gridVisible ? <CheckOutlined fontSize="small" /> : <GridOnOutlined fontSize="small" />}</ListItemIcon>
            <ListItemText primary="Square Grid" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onGridTypeChange('blank');
              onGridVisibleToggle();
              setGridMenuAnchor(null);
            }}
          >
            <ListItemIcon>{!gridVisible ? <CheckOutlined fontSize="small" /> : <CropFreeOutlined fontSize="small" />}</ListItemIcon>
            <ListItemText primary="Blank / No Grid" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              onGridSnapToggle();
              setGridMenuAnchor(null);
            }}
          >
            <ListItemIcon>{gridSnap && <CheckOutlined fontSize="small" />}</ListItemIcon>
            <ListItemText primary="Snap to Grid" />
          </MenuItem>
        </Menu>

        {/* Import JSON */}
        {!isViewer && (
          <Tooltip title="Import JSON / Excalidraw File">
            <IconButton size="small" onClick={onImportClick} sx={{ color: 'inherit' }}>
              <UploadFileOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Export Button */}
        <Tooltip title="Export Diagram (PNG, SVG, JSON)">
          <IconButton size="small" onClick={onExportClick} sx={{ color: 'inherit' }}>
            <DownloadOutlined fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Theme Toggle (Dark/Light) */}
        <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <IconButton size="small" onClick={onThemeToggle} sx={{ color: 'inherit' }}>
            {isDark ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5 }} />

        {/* Share Project Button */}
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<ShareOutlined fontSize="small" />}
          onClick={onOpenShare}
          sx={{
            px: 1.5,
            py: 0.4,
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 1.5,
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
          }}
        >
          Share
        </Button>

        {/* Active Multiplayer Collaborators */}
        {remoteUsers.length > 0 && (
          <AvatarGroup max={3} sx={{ ml: 0.5, '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
            {remoteUsers.map((u) => (
              <Tooltip key={u.userId} title={`${u.userName} (${u.role || 'editor'})`}>
                <Avatar sx={{ bgcolor: u.color || '#3b82f6', border: '2px solid #fff' }}>
                  {u.userName.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        )}

        {/* Current User Profile Avatar */}
        <Tooltip title={currentUser ? `${currentUser.name} (${currentUser.email}) - Switch Account` : 'Sign In'}>
          <IconButton size="small" onClick={onOpenAuth} sx={{ ml: 0.5 }}>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: currentUser?.color || '#6366f1',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '2px solid rgba(99, 102, 241, 0.5)',
              }}
            >
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
