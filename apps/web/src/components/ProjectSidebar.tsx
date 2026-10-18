import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Chip,
  Divider,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Badge,
} from '@mui/material';
import {
  FolderOutlined,
  DescriptionOutlined,
  AddOutlined,
  DeleteOutlined,
  ShareOutlined,
  ExpandMoreOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CreateNewFolderOutlined,
  AccountCircleOutlined,
  LockOutlined,
  EditOutlined,
  VisibilityOutlined,
  AdminPanelSettingsOutlined,
  SyncOutlined,
} from '@mui/icons-material';
import { Project, WhiteboardDocument, ProjectRole } from '@rea/shared-types';
import { useAuth } from '../context/AuthContext';

interface ProjectSidebarProps {
  open: boolean;
  onToggle: () => void;
  projects: Project[];
  currentProject: Project | null;
  currentFile: WhiteboardDocument | null;
  onSelectProject: (projectId: string) => void;
  onSelectFile: (file: WhiteboardDocument) => void;
  onCreateFile: (title: string) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  onCreateProject: (name: string, description?: string) => Promise<void>;
  onOpenShare: () => void;
  onOpenAuth: () => void;
  userRole: ProjectRole;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  open,
  onToggle,
  projects,
  currentProject,
  currentFile,
  onSelectProject,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onCreateProject,
  onOpenShare,
  onOpenAuth,
  userRole = 'editor',
}) => {
  const { user } = useAuth();
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<null | HTMLElement>(null);

  // New File dialog state
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [creatingFile, setCreatingFile] = useState(false);

  // New Project dialog state
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const safeRole: ProjectRole = userRole || 'editor';
  const isViewer = safeRole === 'viewer';
  const isOwner = safeRole === 'owner';

  const handleCreateFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileTitle.trim()) return;
    setCreatingFile(true);
    try {
      await onCreateFile(newFileTitle.trim());
      setNewFileTitle('');
      setNewFileOpen(false);
    } finally {
      setCreatingFile(false);
    }
  };

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

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: open ? 280 : 56,
          flexShrink: 0,
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiDrawer-paper': {
            width: open ? 280 : 56,
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Top Header / Project Folder Selector */}
        <Box
          sx={{
            p: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 52,
          }}
        >
          {open ? (
            <Box
              onClick={(e) => setProjectMenuAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                p: 0.5,
                borderRadius: 1.5,
                flex: 1,
                mr: 0.5,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.06)' },
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1.5,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <FolderOutlined fontSize="small" />
              </Box>
              <Box sx={{ overflow: 'hidden', flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentProject?.name || 'Sailboard Project'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                  <Chip
                    label={safeRole.toUpperCase()}
                    size="small"
                    color={isOwner ? 'primary' : safeRole === 'editor' ? 'success' : 'warning'}
                    sx={{ height: 16, fontSize: '0.62rem', fontWeight: 700 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                    ▼ Switch
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Tooltip title="Expand Project Folder Explorer" placement="right">
              <IconButton onClick={onToggle} size="small" sx={{ mx: 'auto' }}>
                <FolderOutlined fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          )}

          {open && (
            <Tooltip title="Collapse sidebar">
              <IconButton size="small" onClick={onToggle}>
                <ChevronLeftOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Project Selector Menu */}
        <Menu
          anchorEl={projectMenuAnchor}
          open={Boolean(projectMenuAnchor)}
          onClose={() => setProjectMenuAnchor(null)}
          PaperProps={{
            sx: {
              width: 260,
              maxHeight: 340,
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', display: 'block', fontWeight: 600 }}>
            PROJECT FOLDERS
          </Typography>
          {projects.map((p) => (
            <MenuItem
              key={p.id}
              selected={p.id === currentProject?.id}
              onClick={() => {
                onSelectProject(p.id);
                setProjectMenuAnchor(null);
              }}
              sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}
            >
              <Box sx={{ overflow: 'hidden', mr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.files?.length || 0} files • Role: {p.userRole || 'member'}
                </Typography>
              </Box>
              {p.id === currentProject?.id && <Chip label="Active" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />}
            </MenuItem>
          ))}
          <Divider sx={{ my: 1 }} />
          <MenuItem
            onClick={() => {
              setProjectMenuAnchor(null);
              setNewProjectOpen(true);
            }}
            sx={{ color: 'primary.main', fontWeight: 600 }}
          >
            <CreateNewFolderOutlined fontSize="small" sx={{ mr: 1 }} />
            + Create New Project
          </MenuItem>
        </Menu>

        {/* Middle: File Hierarchy inside Project Folder */}
        {open ? (
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {/* Share Project & Actions Bar */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                size="small"
                startIcon={<ShareOutlined fontSize="small" />}
                onClick={onOpenShare}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
              >
                Share & Roles
              </Button>
            </Box>

            {/* Files Header with "+ Add File" */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 0.5,
                mb: 1,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, color: 'text.secondary' }}>
                PROJECT FILES ({currentProject?.files?.length || 0})
              </Typography>
              <Tooltip title={isViewer ? 'Viewers cannot create files' : 'Add new whiteboard file to folder'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={isViewer}
                    onClick={() => setNewFileOpen(true)}
                    sx={{ p: 0.5, color: 'primary.main' }}
                  >
                    <AddOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {/* List of Files: A, B, C */}
            <List disablePadding>
              {currentProject?.files?.map((f, idx) => {
                const isActive = f.id === currentFile?.id;
                return (
                  <ListItem
                    key={f.id}
                    disablePadding
                    sx={{ mb: 0.5 }}
                    secondaryAction={
                      !isViewer && (currentProject?.files?.length || 0) > 1 && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete "${f.title}"?`)) {
                              onDeleteFile(f.id);
                            }
                          }}
                          sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
                        >
                          <DeleteOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemButton
                      selected={isActive}
                      onClick={() => onSelectFile(f)}
                      sx={{
                        borderRadius: 1.5,
                        py: 0.75,
                        px: 1,
                        bgcolor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                        border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                        '&:hover': {
                          bgcolor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 28, color: isActive ? 'primary.main' : 'text.secondary' }}>
                        <DescriptionOutlined sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={f.title}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? 'primary.main' : 'text.primary',
                          noWrap: true,
                          fontSize: '0.825rem',
                        }}
                        secondary={`${f.elements?.length || 0} shapes`}
                        secondaryTypographyProps={{ fontSize: '0.7rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ) : (
          <Box sx={{ flex: 1, py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Expand folder to view files" placement="right">
              <IconButton size="small" onClick={onToggle}>
                <ChevronRightOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            {currentProject?.files?.map((f, idx) => (
              <Tooltip key={f.id} title={f.title} placement="right">
                <IconButton
                  size="small"
                  onClick={() => onSelectFile(f)}
                  color={f.id === currentFile?.id ? 'primary' : 'default'}
                >
                  <DescriptionOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Bottom Profile & Account Switcher */}
        <Box
          sx={{
            p: 1.5,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            bgcolor: 'background.default',
          }}
        >
          {open ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box
                onClick={onOpenAuth}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  cursor: 'pointer',
                  flex: 1,
                  p: 0.5,
                  borderRadius: 1.5,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.06)' },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: user?.color || '#6366f1',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1, noWrap: true }}>
                    {user?.name || 'Guest User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', noWrap: true }}>
                    {user?.email || 'Click to switch/login'}
                  </Typography>
                </Box>
              </Box>

              <Tooltip title="Switch or manage account">
                <Button size="small" variant="text" onClick={onOpenAuth} sx={{ minWidth: 'auto', p: 0.5 }}>
                  <AccountCircleOutlined fontSize="small" />
                </Button>
              </Tooltip>
            </Box>
          ) : (
            <Tooltip title={user?.name || 'Switch Account'} placement="right">
              <IconButton onClick={onOpenAuth} size="small" sx={{ mx: 'auto' }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: user?.color || '#6366f1',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Drawer>

      {/* Dialog: Create New File */}
      <Dialog open={newFileOpen} onClose={() => setNewFileOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New File to Project</DialogTitle>
        <Box component="form" onSubmit={handleCreateFileSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Folder: <b>{currentProject?.name}</b>
            </Typography>
            <TextField
              autoFocus
              label="File Title"
              placeholder="e.g. File D: Microservices Diagram"
              value={newFileTitle}
              onChange={(e) => setNewFileTitle(e.target.value)}
              fullWidth
              size="small"
              required
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setNewFileOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creatingFile || !newFileTitle.trim()}>
              Create File
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog: Create New Project */}
      <Dialog open={newProjectOpen} onClose={() => setNewProjectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Project Folder</DialogTitle>
        <Box component="form" onSubmit={handleCreateProjectSubmit}>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Project Name"
              placeholder="e.g. Payments Infrastructure"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Description (Optional)"
              placeholder="Brief summary of diagrams in this folder"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setNewProjectOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creatingProject || !newProjectName.trim()}>
              Create Project
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};
