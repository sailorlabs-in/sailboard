import React, { useState } from 'react';
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
import { CreateNewFolderOutlined, FolderOutlined, NotesOutlined } from '@mui/icons-material';
import toast from 'react-hot-toast';

export interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description?: string) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateProject(name.trim(), description.trim() || undefined);
      toast.success(`Project folder "${name.trim()}" created!`);
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
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
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CreateNewFolderOutlined />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
            Create Project Folder
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Organize multi-file canvas architecture
          </Typography>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1.5 }}>
          <Box>
            <Typography className="neu-form-label">
              Project Folder Name
            </Typography>
            <TextField
              autoFocus
              placeholder="e.g. Core System Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              size="small"
              disabled={isSubmitting}
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
              Description (optional)
            </Typography>
            <TextField
              placeholder="e.g. Microservices, DB schema & API blueprints"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
              disabled={isSubmitting}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button onClick={handleClose} disabled={isSubmitting} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !name.trim()}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            className="neu-btn-primary"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              px: 2.5,
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
