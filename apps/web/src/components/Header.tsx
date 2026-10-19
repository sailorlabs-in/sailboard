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
  useTheme,
  useMediaQuery,
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
  SailingOutlined,
  SettingsBrightnessOutlined,
} from '@mui/icons-material';
import { UserPresence, ProjectRole, User } from '@rea/shared-types';
import { ThemePreference } from '../theme/theme';

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
  themePreference?: ThemePreference;
  onThemeChange?: (mode: ThemePreference) => void;
  onThemeToggle?: () => void;
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
  onLogout?: () => void;
  currentUser: User | null;
  onToggleSidebar?: () => void;
  onNavigateHome?: () => void;
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
  themePreference = 'system',
  onThemeChange,
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
  onLogout,
  currentUser,
  onToggleSidebar,
  onNavigateHome,
}) => {
  const [gridMenuAnchor, setGridMenuAnchor] = useState<null | HTMLElement>(null);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const safeRole: ProjectRole = userRole || 'editor';
  const isDark = theme === 'dark';
  const isViewer = safeRole === 'viewer';

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));

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
        bgcolor: 'var(--neu-surface)',
        borderBottom: 'var(--neu-border)',
        boxShadow: 'var(--neu-shadow-dock)',
        color: 'var(--neu-text-primary)',
        zIndex: 50,
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 52, px: { xs: 1, sm: 1.5 }, display: 'flex', gap: 1 }}>
        {/* Toggle Folder Sidebar */}
        {onToggleSidebar && (
          <Tooltip title="Toggle Project Folder Explorer">
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                bgcolor: 'var(--neu-surface)',
                boxShadow: 'var(--neu-shadow-btn)',
                border: 'var(--neu-border)',
                color: 'var(--neu-text-primary)',
                mr: 0.5,
                transition: 'all 0.15s ease',
                '&:hover': {
                  boxShadow: 'var(--neu-shadow-btn-hover)',
                  bgcolor: 'var(--neu-surface-hover)',
                },
              }}
            >
              <MenuOpenOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Sailboard Logo & Brand */}
        <Tooltip title="← All Projects (Workspace)">
          <Box
            onClick={onNavigateHome}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              mr: 1,
              cursor: onNavigateHome ? 'pointer' : 'default',
              transition: 'opacity 0.15s ease',
              '&:hover': onNavigateHome ? { opacity: 0.85 } : {},
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-light) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--neu-shadow-btn), 0 0 12px var(--neu-primary-glow)',
                border: 'var(--neu-border)',
              }}
            >
              <SailingOutlined sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.2, color: 'var(--neu-text-primary)' }}>
                Sailboard
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--neu-text-secondary)',
                  fontSize: '0.65rem',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Collaborative Canvas
              </Typography>
            </Box>
          </Box>
        </Tooltip>

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            my: 1,
            mx: 0.5,
            borderColor: 'var(--neu-border-subtle)',
            display: { xs: 'none', sm: 'block' },
          }}
        />

        {/* Project Breadcrumb & Active File Title (Neumorphic Inset Well) */}
        <Box
          className="neu-inset"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: { xs: 'auto', sm: 140 },
            maxWidth: { xs: 150, sm: 380 },
            px: 1.2,
            py: 0.4,
            borderRadius: '10px',
          }}
        >
          <Box
            onClick={onNavigateHome}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              cursor: onNavigateHome ? 'pointer' : 'default',
              '&:hover': onNavigateHome ? { color: 'var(--neu-primary)' } : {},
            }}
          >
            <FolderOutlined sx={{ fontSize: 16, color: 'var(--neu-text-secondary)' }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'var(--neu-text-secondary)',
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {projectName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--neu-text-muted)' }}>
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
                color: 'var(--neu-text-primary)',
                background: 'var(--neu-bg)',
                border: '1px solid var(--neu-primary-light)',
                borderRadius: 6,
                padding: '2px 8px',
                outline: 'none',
                boxShadow: 'var(--neu-shadow-inset)',
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
                py: 0.2,
                borderRadius: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: isViewer ? 'transparent' : 'rgba(255,255,255,0.06)',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--neu-text-primary)' }} noWrap>
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
              boxShadow: 'var(--neu-shadow-btn)',
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
              display: { xs: 'none', sm: 'inline-flex' },
              '& .MuiChip-label': { px: 0.6 },
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* View Mode Selector (Neumorphic Segmented Control) */}
        <Box
          className="neu-segmented"
          sx={{
            display: 'inline-flex',
            mr: { xs: 0.5, sm: 1 },
          }}
        >
          <Tooltip title="Split View: Docs + Canvas (Desktop)">
            <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
              <button
                type="button"
                className={`neu-segmented-item ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => onViewModeChange('split')}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ViewSidebarOutlined sx={{ fontSize: 15 }} />
                <span>Split</span>
              </button>
            </Box>
          </Tooltip>
          <Tooltip title="Canvas Only (Whiteboard)">
            <button
              type="button"
              className={`neu-segmented-item ${viewMode === 'canvas' ? 'active' : ''}`}
              onClick={() => onViewModeChange('canvas')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <SpaceDashboardOutlined sx={{ fontSize: 15 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Canvas</Box>
            </button>
          </Tooltip>
          <Tooltip title="Notes Only (Markdown Docs)">
            <button
              type="button"
              className={`neu-segmented-item ${viewMode === 'notes' ? 'active' : ''}`}
              onClick={() => onViewModeChange('notes')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <DescriptionOutlined sx={{ fontSize: 15 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Notes</Box>
            </button>
          </Tooltip>
        </Box>

        {/* Style Mode (Neumorphic Segmented Control) */}
        <Box
          className="neu-segmented"
          sx={{
            display: { xs: 'none', md: 'inline-flex' },
            mr: 1,
          }}
        >
          <Tooltip title="Hand-drawn Rough.js Style">
            <button
              type="button"
              className={`neu-segmented-item ${styleMode === 'rough' ? 'active' : ''}`}
              onClick={() => onStyleModeChange('rough')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <BrushOutlined sx={{ fontSize: 15 }} />
              <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Sketch</Box>
            </button>
          </Tooltip>
          <Tooltip title="Clean Geometric Mode">
            <button
              type="button"
              className={`neu-segmented-item ${styleMode === 'clean' ? 'active' : ''}`}
              onClick={() => onStyleModeChange('clean')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ArchitectureOutlined sx={{ fontSize: 15 }} />
              <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Clean</Box>
            </button>
          </Tooltip>
        </Box>

        {/* Undo / Redo */}
        {!isViewer && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, mr: 0.5 }}>
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton
                  size="small"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="neu-icon-btn"
                  sx={{ width: 30, height: 30 }}
                >
                  <UndoOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton
                  size="small"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="neu-icon-btn"
                  sx={{ width: 30, height: 30 }}
                >
                  <RedoOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        {/* Zoom Controls */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.5, mr: 1 }}>
          <Tooltip title="Zoom Out (-)">
            <IconButton
              size="small"
              onClick={onZoomOut}
              className="neu-icon-btn"
              sx={{ width: 30, height: 30 }}
            >
              <ZoomOutOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Click to Reset Zoom (100%)">
            <Typography
              variant="caption"
              onClick={onZoomReset}
              className="neu-inset"
              sx={{
                cursor: 'pointer',
                px: 1,
                py: 0.3,
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.72rem',
                minWidth: 44,
                textAlign: 'center',
                color: 'var(--neu-text-primary)',
              }}
            >
              {Math.round(zoom * 100)}%
            </Typography>
          </Tooltip>
          <Tooltip title="Zoom In (+)">
            <IconButton
              size="small"
              onClick={onZoomIn}
              className="neu-icon-btn"
              sx={{ width: 30, height: 30 }}
            >
              <ZoomInOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom to Fit">
            <IconButton
              size="small"
              onClick={onZoomToFit}
              className="neu-icon-btn"
              sx={{ width: 30, height: 30 }}
            >
              <FitScreenOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Grid Settings */}
        <Tooltip title="Grid & Snapping Settings">
          <IconButton
            size="small"
            onClick={(e) => setGridMenuAnchor(e.currentTarget)}
            className={`neu-icon-btn ${gridVisible ? 'active' : ''}`}
            sx={{ width: 32, height: 32 }}
          >
            {gridType === 'dots' ? <GrainOutlined fontSize="small" /> : <GridOnOutlined fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={gridMenuAnchor}
          open={Boolean(gridMenuAnchor)}
          onClose={() => setGridMenuAnchor(null)}
          slotProps={{
            paper: {
              className: 'neu-floating',
              sx: {
                bgcolor: 'var(--neu-surface)',
                border: 'var(--neu-border)',
                boxShadow: 'var(--neu-shadow-floating)',
                borderRadius: '14px',
              },
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
          <Divider sx={{ my: 0.5, borderColor: 'var(--neu-border-subtle)' }} />
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
            <IconButton
              size="small"
              onClick={onImportClick}
              className="neu-icon-btn"
              sx={{ width: 32, height: 32 }}
            >
              <UploadFileOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Export Button */}
        <Tooltip title="Export Diagram (PNG, SVG, JSON)">
          <IconButton
            size="small"
            onClick={onExportClick}
            className="neu-icon-btn"
            sx={{ width: 32, height: 32 }}
          >
            <DownloadOutlined fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Theme Mode Selector (Light / Dark / System) */}
        <Tooltip title={`Theme: ${themePreference.charAt(0).toUpperCase() + themePreference.slice(1)} (Click to switch)`}>
          <IconButton
            size="small"
            onClick={(e) => {
              if (onThemeChange) {
                setThemeMenuAnchor(e.currentTarget);
              } else if (onThemeToggle) {
                onThemeToggle();
              }
            }}
            className="neu-icon-btn"
            sx={{ width: 32, height: 32 }}
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
          anchorEl={themeMenuAnchor}
          open={Boolean(themeMenuAnchor)}
          onClose={() => setThemeMenuAnchor(null)}
          slotProps={{
            paper: {
              className: 'neu-floating',
              sx: {
                bgcolor: 'var(--neu-surface)',
                border: 'var(--neu-border)',
                boxShadow: 'var(--neu-shadow-floating)',
                minWidth: 160,
                borderRadius: '14px',
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              onThemeChange?.('light');
              setThemeMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <LightModeOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Light Mode" />
            {themePreference === 'light' && <CheckOutlined fontSize="small" color="primary" />}
          </MenuItem>
          <MenuItem
            onClick={() => {
              onThemeChange?.('dark');
              setThemeMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <DarkModeOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dark Mode" />
            {themePreference === 'dark' && <CheckOutlined fontSize="small" color="primary" />}
          </MenuItem>
          <MenuItem
            onClick={() => {
              onThemeChange?.('system');
              setThemeMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <SettingsBrightnessOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="System (Auto)" />
            {themePreference === 'system' && <CheckOutlined fontSize="small" color="primary" />}
          </MenuItem>
        </Menu>

        <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5, borderColor: 'var(--neu-border-subtle)' }} />

        {/* Share Project Button */}
        {isMobile ? (
          <Tooltip title="Share Project & Permissions">
            <IconButton
              size="small"
              onClick={onOpenShare}
              className="neu-btn-primary"
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
              }}
            >
              <ShareOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            size="small"
            variant="contained"
            startIcon={<ShareOutlined fontSize="small" />}
            onClick={onOpenShare}
            className="neu-btn-primary"
            sx={{
              px: 1.8,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
            }}
          >
            Share
          </Button>
        )}

        {/* Active Multiplayer Collaborators */}
        {remoteUsers.length > 0 && (
          <AvatarGroup max={3} sx={{ ml: 0.5, '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem', boxShadow: 'var(--neu-shadow-raised-sm)', border: '2px solid var(--neu-surface)' } }}>
            {remoteUsers.map((u) => (
              <Tooltip key={u.userId} title={`${u.userName} (${u.role || 'editor'})`}>
                <Avatar sx={{ bgcolor: u.color || '#3b82f6' }}>
                  {u.userName.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        )}

        {/* Current User Profile Avatar */}
        <Tooltip title={currentUser ? `${currentUser.name} (${currentUser.email})` : 'Account'}>
          <IconButton
            size="small"
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{ ml: 0.5, p: 0.3 }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: currentUser?.color || 'var(--neu-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                boxShadow: 'var(--neu-shadow-btn)',
                border: 'var(--neu-border)',
              }}
            >
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Profile Popover Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
          slotProps={{
            paper: {
              className: 'neu-floating',
              sx: {
                width: 240,
                borderRadius: '14px',
                p: 0.5,
                bgcolor: 'var(--neu-surface)',
                border: 'var(--neu-border)',
                boxShadow: 'var(--neu-shadow-floating)',
              },
            },
          }}
        >
          {currentUser && (
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'var(--neu-text-primary)' }}>
                {currentUser.name}
              </Typography>
              <Typography variant="caption" noWrap sx={{ display: 'block', color: 'var(--neu-text-secondary)' }}>
                {currentUser.email}
              </Typography>
              <Chip
                label={`Role: ${safeRole.toUpperCase()}`}
                size="small"
                color={safeRole === 'owner' ? 'primary' : safeRole === 'editor' ? 'success' : 'warning'}
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, mt: 0.8 }}
              />
            </Box>
          )}
          <Divider sx={{ my: 0.5, borderColor: 'var(--neu-border-subtle)' }} />
          {onNavigateHome && (
            <MenuItem
              onClick={() => {
                setUserMenuAnchor(null);
                onNavigateHome();
              }}
              sx={{ fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px' }}
            >
              <ListItemIcon>
                <SpaceDashboardOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Projects & Files" />
            </MenuItem>
          )}
          {onLogout && (
            <MenuItem
              onClick={() => {
                setUserMenuAnchor(null);
                onLogout();
              }}
              sx={{ color: 'error.main', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px' }}
            >
              Sign Out
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
