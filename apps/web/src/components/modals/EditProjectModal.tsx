import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { EditOutlined, FolderOutlined, NotesOutlined } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { Project } from '@rea/shared-types';

export interface EditProjectModalProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onUpdateProject: (projectId: string, updates: { name?: string; description?: string }) => Promise<void>;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  open,
  project,
  onClose,
  onUpdateProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
      });
      toast.success(`Project folder renamed to "${name.trim()}"`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
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
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            flexShrink: 0,
            boxShadow: 'var(--neu-shadow-btn)',
          }}
        >
          <EditOutlined fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
            Edit Project Folder
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.72rem' }}>
            Update folder title and workspace notes
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 1.5 }}>
          <Box sx={{ mb: 2 }}>
            <Typography className="neu-form-label">
              Folder Name
            </Typography>
            <TextField
              autoFocus
              placeholder="e.g. Mobile App System Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FolderOutlined sx={{ color: 'var(--neu-text-secondary)', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            <Typography className="neu-form-label">
              Description (Optional)
            </Typography>
            <TextField
              placeholder="What does this project contain?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <NotesOutlined sx={{ color: 'var(--neu-text-secondary)', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            className="neu-btn"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              color: 'var(--neu-text-secondary)',
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !name.trim()}
            className="neu-btn-primary"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              minWidth: 100,
            }}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
