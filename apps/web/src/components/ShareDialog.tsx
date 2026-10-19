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
import { ConfirmDeleteModal } from './modals';

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

  // Modal state for removing members
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);

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

  const handleRequestRemoveMember = (member: ProjectMember) => {
    setMemberToRemove(member);
    setConfirmRemoveOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      await api.removeProjectMember(project.id, memberToRemove.id);
      const refreshed = await api.getProject(project.id);
      onProjectUpdated(refreshed);
      setSuccessMsg(`Removed ${memberToRemove.userEmail} from project`);
      setConfirmRemoveOpen(false);
      setMemberToRemove(null);
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
          className: 'neu-floating',
          sx: {
            borderRadius: '18px',
            bgcolor: 'var(--neu-surface)',
            border: 'var(--neu-border)',
            boxShadow: 'var(--neu-shadow-floating)',
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
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 8px var(--neu-primary-glow)',
            }}
          >
            <FolderSpecialOutlined fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'var(--neu-text-primary)' }}>
              Share Project & Manage Permissions
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)' }}>
              Folder: <b>{project.name}</b> • {project.files?.length || 0} Files
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} className="neu-icon-btn" sx={{ width: 30, height: 30 }}>
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
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'var(--neu-text-primary)' }}>
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
                className="neu-btn-primary"
                sx={{ textTransform: 'none', px: 2, whiteSpace: 'nowrap', borderRadius: '10px' }}
              >
                Invite
              </Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
            You have <b>{project.userRole?.toUpperCase()}</b> permission on this project. Only the project owner (<b>{project.ownerName}</b>) can invite new users and change permissions.
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Member List */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'var(--neu-text-primary)' }}>
          Project Members & Permissions ({project.members?.length || 1})
        </Typography>

        <List className="neu-inset" sx={{ borderRadius: '12px', p: 1 }}>
          {/* Owner Item */}
          <ListItem sx={{ py: 1, borderBottom: 'var(--neu-border-subtle)' }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'var(--neu-primary)', width: 36, height: 36, fontSize: '0.875rem', fontWeight: 700, boxShadow: 'var(--neu-shadow-btn)' }}>
                {project.ownerName ? project.ownerName.slice(0, 2).toUpperCase() : 'OW'}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--neu-text-primary)' }}>
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
                  <Avatar sx={{ bgcolor: '#ec4899', width: 36, height: 36, fontSize: '0.875rem', fontWeight: 700, boxShadow: 'var(--neu-shadow-btn)' }}>
                    {member.userName ? member.userName.slice(0, 2).toUpperCase() : member.userEmail.slice(0, 2).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--neu-text-primary)' }}>
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
                        <IconButton size="small" color="error" onClick={() => handleRequestRemoveMember(member)} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
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
          className="neu-btn"
          sx={{ textTransform: 'none', px: 1.5, py: 0.5, borderRadius: '8px' }}
        >
          {copied ? 'Link Copied!' : 'Copy Project Link'}
        </Button>
        <Button onClick={onClose} variant="contained" size="small" className="neu-btn-primary" sx={{ px: 2.5, py: 0.5, borderRadius: '8px' }}>
          Done
        </Button>
      </DialogActions>

      {/* Confirm Remove Member Modal */}
      <ConfirmDeleteModal
        open={confirmRemoveOpen}
        title="Remove Team Member"
        itemType="team member"
        itemName={memberToRemove?.userName || memberToRemove?.userEmail}
        warningText="They will immediately lose access to all canvases and docs in this folder."
        onClose={() => {
          setConfirmRemoveOpen(false);
          setMemberToRemove(null);
        }}
        onConfirm={handleConfirmRemoveMember}
      />
    </Dialog>
  );
};
