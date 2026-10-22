import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
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
  ManageAccountsOutlined,
  EditOutlined,
  SpaceDashboardOutlined,
} from '@mui/icons-material';
import { Project, WhiteboardDocument, ProjectRole } from '@rea/shared-types';
import { useAuth } from '../context/AuthContext';
import { animateStaggerIn } from '../utils/animations';
import {
  ConfirmDeleteModal,
  CreateFileModal,
  CreateProjectModal,
  EditProjectModal,
  RenameFileModal,
} from './modals';

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
  onUpdateProject?: (projectId: string, updates: { name?: string; description?: string }) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onRenameFile?: (fileId: string, newTitle: string) => Promise<void>;
  onOpenShare: () => void;
  onOpenAuth: () => void;
  onOpenAccountManage?: () => void;
  userRole: ProjectRole;
  onNavigateHome?: () => void;
}

function ProjectSidebarComponent({
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
  onUpdateProject,
  onDeleteProject,
  onRenameFile,
  onOpenShare,
  onOpenAuth,
  onOpenAccountManage,
  userRole = 'editor',
  onNavigateHome,
}: ProjectSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<null | HTMLElement>(null);

  // Modal dialog states
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState<WhiteboardDocument | null>(null);

  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<WhiteboardDocument | null>(null);

  const safeRole: ProjectRole = userRole || 'editor';
  const isViewer = safeRole === 'viewer' || safeRole === 'commenter';
  const isOwner = safeRole === 'owner';

  const filesListRef = useRef<HTMLUListElement | null>(null);

  // Stagger animate files list when drawer is opened or project files change
  useEffect(() => {
    if (open && filesListRef.current?.children.length) {
      animateStaggerIn(filesListRef.current.children, { stagger: 0.04, y: 12, scale: 0.98 });
    }
  }, [open, currentProject?.id, currentProject?.files?.length]);

  return (
    <>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: open ? 280 : isMobile ? 0 : 56,
          flexShrink: 0,
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiDrawer-paper': {
            position: isMobile ? 'fixed' : 'relative',
            height: '100%',
            top: isMobile ? 0 : 'auto',
            bottom: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 1300 : 'auto',
            width: open ? 280 : isMobile ? 0 : 56,
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            bgcolor: 'var(--neu-surface)',
            borderRight: 'var(--neu-border)',
            display: isMobile && !open ? 'none' : 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Top Header / Project Folder Selector */}
        <Box
          sx={{
            p: 1.5,
            borderBottom: 'var(--neu-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 52,
          }}
        >
          {open ? (
            <Box
              onClick={(e) => setProjectMenuAnchor(e.currentTarget)}
              className="neu-flat-sm"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                p: 0.8,
                borderRadius: '10px',
                flex: 1,
                mr: 0.8,
                transition: 'all 0.15s ease',
                '&:hover': {
                  boxShadow: 'var(--neu-shadow-btn-hover)',
                  bgcolor: 'var(--neu-surface-hover)',
                },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-light) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px var(--neu-primary-glow)',
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
                    color: 'var(--neu-text-primary)',
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                    <ExpandMoreOutlined sx={{ fontSize: 13, color: 'var(--neu-text-secondary)' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'var(--neu-text-secondary)' }}>
                      Switch
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Tooltip title="Expand Project Folder Explorer" placement="right">
              <IconButton onClick={onToggle} size="small" className="neu-icon-btn" sx={{ mx: 'auto', width: 34, height: 34 }}>
                <FolderOutlined fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          )}

          {open && (
            <Tooltip title="Collapse sidebar">
              <IconButton size="small" onClick={onToggle} className="neu-icon-btn" sx={{ width: 30, height: 30 }}>
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
          slotProps={{
            paper: {
              className: 'neu-floating',
              sx: {
                width: 260,
                maxHeight: 340,
                borderRadius: '14px',
                bgcolor: 'var(--neu-surface)',
                border: 'var(--neu-border)',
                boxShadow: 'var(--neu-shadow-floating)',
              },
            },
          }}
        >
          <Typography variant="caption" sx={{ px: 2, py: 1, color: 'var(--neu-text-secondary)', display: 'block', fontWeight: 600 }}>
            PROJECT FOLDERS
          </Typography>
          {projects.map((p) => {
            const isProjOwner = p.userRole === 'owner';
            const canEditProj = p.userRole === 'owner' || p.userRole === 'editor';
            return (
              <MenuItem
                key={p.id}
                selected={p.id === currentProject?.id}
                onClick={() => {
                  onSelectProject(p.id);
                  setProjectMenuAnchor(null);
                }}
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderRadius: '8px', mx: 0.5 }}
              >
                <Box sx={{ overflow: 'hidden', mr: 1, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--neu-text-primary)' }}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)' }}>
                    {p.files?.length || 0} files • Role: {p.userRole || 'member'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  {p.id === currentProject?.id && <Chip label="Active" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />}
                  {onUpdateProject && canEditProj && (
                    <Tooltip title="Edit project folder">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectMenuAnchor(null);
                          setProjectToEdit(p);
                          setEditProjectModalOpen(true);
                        }}
                        className="neu-icon-btn"
                        sx={{ width: 24, height: 24, p: 0.2 }}
                      >
                        <EditOutlined sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDeleteProject && isProjOwner && (
                    <Tooltip title="Delete project folder">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectMenuAnchor(null);
                          setProjectToDelete(p);
                          setDeleteProjectModalOpen(true);
                        }}
                        className="neu-icon-btn"
                        sx={{ width: 24, height: 24, p: 0.2, color: 'error.main' }}
                      >
                        <DeleteOutlined sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </MenuItem>
            );
          })}
          <Divider sx={{ my: 0.5, borderColor: 'var(--neu-border-subtle)' }} />
          {onNavigateHome && (
            <MenuItem
              onClick={() => {
                setProjectMenuAnchor(null);
                onNavigateHome();
              }}
              sx={{ fontWeight: 600, borderRadius: '8px', mx: 0.5, fontSize: '0.85rem' }}
            >
              <SpaceDashboardOutlined fontSize="small" sx={{ mr: 1, color: 'var(--neu-primary)' }} />
              Projects & Files Dashboard
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              setProjectMenuAnchor(null);
              setNewProjectOpen(true);
            }}
            sx={{ color: 'var(--neu-primary-light)', fontWeight: 600, borderRadius: '8px', mx: 0.5, fontSize: '0.85rem' }}
          >
            <CreateNewFolderOutlined fontSize="small" sx={{ mr: 1 }} />
            + Create New Project
          </MenuItem>
        </Menu>

        {/* Middle: File Hierarchy inside Project Folder */}
        {open ? (
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {/* Share Project & Actions Bar */}
            <Box sx={{ display: 'flex', gap: 0.8, mb: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                startIcon={<ShareOutlined fontSize="small" />}
                onClick={onOpenShare}
                className="neu-btn"
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', py: 0.6 }}
              >
                Share & Roles
              </Button>
              {onUpdateProject && currentProject && (safeRole === 'owner' || safeRole === 'editor') && (
                <Tooltip title="Edit project folder">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setProjectToEdit(currentProject);
                      setEditProjectModalOpen(true);
                    }}
                    className="neu-icon-btn"
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDeleteProject && currentProject && isOwner && (
                <Tooltip title="Delete project folder">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setProjectToDelete(currentProject);
                      setDeleteProjectModalOpen(true);
                    }}
                    className="neu-icon-btn"
                    sx={{ width: 32, height: 32, flexShrink: 0, '&:hover': { color: 'error.main' } }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
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
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, color: 'var(--neu-text-secondary)' }}>
                PROJECT FILES ({currentProject?.files?.length || 0})
              </Typography>
              <Tooltip title={isViewer ? 'Viewers cannot create files' : 'Add new whiteboard file to folder'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={isViewer}
                    onClick={() => setNewFileOpen(true)}
                    className="neu-icon-btn"
                    sx={{ width: 28, height: 28, color: 'var(--neu-primary-light)' }}
                  >
                    <AddOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {/* List of Files or Empty State */}
            {(!currentProject?.files || currentProject.files.length === 0) ? (
              <Box className="neu-inset" sx={{ p: 2, textAlign: 'center', borderRadius: '12px' }}>
                <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', display: 'block', mb: 1 }}>
                  This project folder is empty.
                </Typography>
                {!isViewer && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddOutlined fontSize="small" />}
                    onClick={() => setNewFileOpen(true)}
                    className="neu-btn"
                    sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: '8px' }}
                  >
                    Create Canvas
                  </Button>
                )}
              </Box>
            ) : (
              <List ref={filesListRef} disablePadding>
                {currentProject?.files?.map((f) => {
                  const isActive = f.id === currentFile?.id;
                  return (
                    <ListItem
                      key={f.id}
                      disablePadding
                      sx={{ mb: 0.8 }}
                      secondaryAction={
                        !isViewer && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mr: 0.5 }}>
                            {onRenameFile && (
                              <Tooltip title="Rename canvas">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFileToRename(f);
                                    setRenameModalOpen(true);
                                  }}
                                  className="neu-icon-btn"
                                  sx={{ width: 24, height: 24 }}
                                >
                                  <EditOutlined sx={{ fontSize: 13 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete canvas">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFileToDelete(f);
                                  setDeleteModalOpen(true);
                                }}
                                className="neu-icon-btn"
                                sx={{ width: 24, height: 24, '&:hover': { color: 'error.main' } }}
                              >
                                <DeleteOutlined sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }
                    >
                      <ListItemButton
                        selected={isActive}
                        onClick={() => {
                          onSelectFile(f);
                          if (isMobile) onToggle();
                        }}
                        className={isActive ? 'neu-pressed' : ''}
                        sx={{
                          borderRadius: '10px',
                          py: 0.8,
                          pl: 1.2,
                          pr: 8,
                          bgcolor: isActive ? 'var(--neu-bg)' : 'transparent',
                          boxShadow: isActive ? 'var(--neu-shadow-pressed)' : 'none',
                          border: isActive ? 'var(--neu-border-inset)' : '1px solid transparent',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: isActive ? 'var(--neu-bg)' : 'var(--neu-surface-hover)',
                            boxShadow: isActive ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-btn)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: isActive ? 'var(--neu-primary-light)' : 'var(--neu-text-secondary)' }}>
                          <DescriptionOutlined sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--neu-primary-light)' : 'var(--neu-text-primary)',
                                fontSize: '0.825rem',
                              }}
                            >
                              {f.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'var(--neu-text-secondary)' }}>
                              {(() => {
                                const activeCount = f.elements?.filter((el) => !el.isDeleted).length || 0;
                                return `${activeCount} ${activeCount === 1 ? 'shape' : 'shapes'}`;
                              })()}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        ) : (
          <Box sx={{ flex: 1, py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Expand folder to view files" placement="right">
              <IconButton size="small" onClick={onToggle} className="neu-icon-btn" sx={{ width: 32, height: 32 }}>
                <ChevronRightOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            {currentProject?.files?.map((f) => (
              <Tooltip key={f.id} title={f.title} placement="right">
                <IconButton
                  size="small"
                  onClick={() => onSelectFile(f)}
                  className={`neu-icon-btn ${f.id === currentFile?.id ? 'active' : ''}`}
                  sx={{ width: 34, height: 34 }}
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
            borderTop: 'var(--neu-border)',
            bgcolor: 'var(--neu-surface)',
          }}
        >
          {open ? (
            <Box
              className="neu-inset"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 0.8,
                borderRadius: '12px',
              }}
            >
              <Box
                onClick={() => (onOpenAccountManage ? onOpenAccountManage() : onOpenAuth())}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  cursor: 'pointer',
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: user?.color || 'var(--neu-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    boxShadow: 'var(--neu-shadow-btn)',
                    border: 'var(--neu-border)',
                  }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.1, color: 'var(--neu-text-primary)' }}>
                    {user?.name || 'Guest User'}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ fontSize: '0.68rem', color: 'var(--neu-text-secondary)' }}>
                    {user?.email || 'Click to switch / manage'}
                  </Typography>
                </Box>
              </Box>

              <Tooltip title="Manage Account & Switch Profiles">
                <Button
                  size="small"
                  variant="text"
                  onClick={() => (onOpenAccountManage ? onOpenAccountManage() : onOpenAuth())}
                  sx={{ minWidth: 'auto', p: 0.5, color: 'var(--neu-text-secondary)' }}
                >
                  <ManageAccountsOutlined fontSize="small" />
                </Button>
              </Tooltip>
            </Box>
          ) : (
            <Tooltip title={user ? `${user.name} (Manage/Switch)` : 'Manage Account'} placement="right">
              <IconButton
                onClick={() => (onOpenAccountManage ? onOpenAccountManage() : onOpenAuth())}
                size="small"
                className="neu-icon-btn"
                sx={{ mx: 'auto', width: 34, height: 34 }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: user?.color || 'var(--neu-primary)',
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

      {/* Confirm Delete Canvas Modal */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Canvas File"
        itemType="canvas file"
        itemName={selectedFileToDelete?.title}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedFileToDelete(null);
        }}
        onConfirm={async () => {
          if (selectedFileToDelete) {
            await onDeleteFile(selectedFileToDelete.id);
            setDeleteModalOpen(false);
            setSelectedFileToDelete(null);
          }
        }}
      />

      {/* Create New File Modal */}
      <CreateFileModal
        open={newFileOpen}
        projects={projects}
        initialProjectId={currentProject?.id}
        onClose={() => setNewFileOpen(false)}
        onCreateFile={async (_projId, title) => {
          await onCreateFile(title);
        }}
        onCreateProjectClick={() => setNewProjectOpen(true)}
      />

      {/* Create New Project Folder Modal */}
      <CreateProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreateProject={onCreateProject}
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
        open={renameModalOpen}
        initialTitle={fileToRename?.title || ''}
        onClose={() => {
          setRenameModalOpen(false);
          setFileToRename(null);
        }}
        onRename={async (newTitle) => {
          if (fileToRename && onRenameFile) {
            await onRenameFile(fileToRename.id, newTitle);
          }
        }}
      />
    </>
  );
}

export const ProjectSidebar = React.memo(ProjectSidebarComponent);
