import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  CloseOutlined,
  PersonAddOutlined,
  DeleteOutlined,
  ContentCopyOutlined,
  CheckCircleOutlined,
  AdminPanelSettingsOutlined,
  EditOutlined,
  VisibilityOutlined,
  FolderSpecialOutlined,
} from '@mui/icons-material';
import { Project, ProjectMember, ProjectRole } from '@rea/shared-types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onProjectUpdated: (updatedProject: Project) => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  project,
  onProjectUpdated,
}) => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('editor');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const isOwner = project.ownerId === user?.id || project.userRole === 'owner';

  const handleInviteOrUpdateRole = async (emailToInvite?: string, roleToAssign?: ProjectRole) => {
    const targetEmail = (emailToInvite || inviteEmail).trim();
    const targetRole = roleToAssign || inviteRole;

    if (!targetEmail) {
      setErrorMsg('Please enter an email address');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.addProjectMember(project.id, targetEmail, targetRole);
      // Reload project details
      const refreshed = await api.getProject(project.id);
      onProjectUpdated(refreshed);
      setSuccessMsg(`Successfully updated permission for ${targetEmail} as ${targetRole.toUpperCase()}`);
      setInviteEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!window.confirm(`Remove ${member.userName || member.userEmail} from this project?`)) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await api.removeProjectMember(project.id, member.id);
      const refreshed = await api.getProject(project.id);
      onProjectUpdated(refreshed);
      setSuccessMsg(`Removed ${member.userEmail} from project`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <FolderSpecialOutlined fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Share Project & Manage Permissions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Folder: <b>{project.name}</b> • {project.files?.length || 0} Files
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 2 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {/* Invite Form (Only enabled for Owner) */}
        {isOwner ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Invite collaborator by email
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                placeholder="colleague@sailboard.io"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                size="small"
                fullWidth
                sx={{ flex: 1 }}
              />
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="editor">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditOutlined fontSize="small" color="primary" />
                    <span>Editor</span>
                  </Box>
                </MenuItem>
                <MenuItem value="viewer">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VisibilityOutlined fontSize="small" color="warning" />
                    <span>Viewer</span>
                  </Box>
                </MenuItem>
              </Select>
              <Button
                variant="contained"
                onClick={() => handleInviteOrUpdateRole()}
                disabled={loading || !inviteEmail.trim()}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PersonAddOutlined />}
                sx={{ textTransform: 'none', px: 2, whiteSpace: 'nowrap' }}
              >
                Invite
              </Button>
            </Box>

            {/* Quick Demo Invite Buttons */}
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Quick test:
              </Typography>
              <Chip
                label="Set Bob as Editor"
                size="small"
                variant="outlined"
                color="primary"
                clickable
                onClick={() => handleInviteOrUpdateRole('bob@sailboard.io', 'editor')}
                sx={{ fontSize: '0.72rem' }}
              />
              <Chip
                label="Set Bob as Viewer (Read-Only)"
                size="small"
                variant="outlined"
                color="warning"
                clickable
                onClick={() => handleInviteOrUpdateRole('bob@sailboard.io', 'viewer')}
                sx={{ fontSize: '0.72rem' }}
              />
            </Box>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
            You have <b>{project.userRole?.toUpperCase()}</b> permission on this project. Only the project owner (<b>{project.ownerName}</b>) can invite new users and change permissions.
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Member List */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Project Members & Permissions ({project.members?.length || 1})
        </Typography>

        <List sx={{ bgcolor: 'background.default', borderRadius: 2, p: 0.5, border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Owner Item */}
          <ListItem sx={{ py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: '#6366f1', width: 36, height: 36, fontSize: '0.875rem', fontWeight: 700 }}>
                {project.ownerName ? project.ownerName.slice(0, 2).toUpperCase() : 'OW'}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {project.ownerName || 'Project Owner'}
                  </Typography>
                  {project.ownerId === user?.id && (
                    <Chip label="You" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                </Box>
              }
              secondary="Owner of this project folder"
            />
            <ListItemSecondaryAction>
              <Chip
                icon={<AdminPanelSettingsOutlined sx={{ fontSize: '14px !important' }} />}
                label="Owner"
                size="small"
                color="primary"
                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
              />
            </ListItemSecondaryAction>
          </ListItem>

          {/* Collaborator Members */}
          {project.members
            ?.filter((m) => m.role !== 'owner')
            .map((member) => (
              <ListItem key={member.id} sx={{ py: 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#ec4899', width: 36, height: 36, fontSize: '0.875rem', fontWeight: 700 }}>
                    {member.userName ? member.userName.slice(0, 2).toUpperCase() : member.userEmail.slice(0, 2).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {member.userName || member.userEmail.split('@')[0]}
                      </Typography>
                      {member.userId === user?.id && (
                        <Chip label="You" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  }
                  secondary={member.userEmail}
                />
                <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isOwner ? (
                    <>
                      <Select
                        value={member.role}
                        onChange={(e) => handleInviteOrUpdateRole(member.userEmail, e.target.value as ProjectRole)}
                        size="small"
                        sx={{ height: 32, fontSize: '0.8rem', minWidth: 105 }}
                      >
                        <MenuItem value="editor">Editor</MenuItem>
                        <MenuItem value="viewer">Viewer</MenuItem>
                      </Select>
                      <Tooltip title="Remove member">
                        <IconButton size="small" color="error" onClick={() => handleRemoveMember(member)}>
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Chip
                      label={member.role === 'editor' ? 'Editor' : 'Viewer'}
                      size="small"
                      color={member.role === 'editor' ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
        <Button
          startIcon={copied ? <CheckCircleOutlined color="success" /> : <ContentCopyOutlined />}
          onClick={handleCopyLink}
          size="small"
          sx={{ textTransform: 'none' }}
        >
          {copied ? 'Link Copied!' : 'Copy Project Link'}
        </Button>
        <Button onClick={onClose} variant="contained" size="small">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
