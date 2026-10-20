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
import { DescriptionOutlined, CreateNewFolderOutlined } from '@mui/icons-material';
import { Project } from '@rea/shared-types';
import toast from 'react-hot-toast';

export interface CreateFileModalProps {
  open: boolean;
  projects: Project[];
  initialProjectId?: string;
  onClose: () => void;
  onCreateFile: (projectId: string, title: string) => Promise<void>;
  onCreateProjectClick?: () => void;
}

export function CreateFileModal({
  open,
  projects,
  initialProjectId,
  onClose,
  onCreateFile,
  onCreateProjectClick,
}: CreateFileModalProps) {
  const [title, setTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [initialProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetId = selectedProjectId || (projects.length > 0 ? projects[0].id : '');
    if (!targetId) {
      toast.error('Please create or select a project folder first!');
      onClose();
      onCreateProjectClick?.();
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateFile(targetId, title.trim());
      toast.success(`Canvas "${title.trim()}" created!`);
      setTitle('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create canvas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
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
            bgcolor: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DescriptionOutlined />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
            Create New Canvas
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Whiteboard & system design board
          </Typography>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1.5 }}>
          {projects.length > 0 ? (
            <Box>
              <Typography className="neu-form-label">
                Target Folder
              </Typography>
              <TextField
                select
                value={selectedProjectId || projects[0]?.id || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                size="small"
                fullWidth
                slotProps={{ select: { native: true } }}
                disabled={isSubmitting}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </TextField>
            </Box>
          ) : (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, display: 'block' }}>
                No project folders available. Create a folder to house canvases.
              </Typography>
              <Button
                size="small"
                startIcon={<CreateNewFolderOutlined fontSize="small" />}
                onClick={() => {
                  onClose();
                  onCreateProjectClick?.();
                }}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
              >
                + Create Folder
              </Button>
            </Box>
          )}

          <Box>
            <Typography className="neu-form-label">
              Canvas File Title
            </Typography>
            <TextField
              autoFocus
              placeholder="e.g. Kubernetes Cluster Topology"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              size="small"
              disabled={isSubmitting}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionOutlined sx={{ color: 'var(--neu-text-secondary)', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
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
            disabled={isSubmitting || !title.trim()}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            className="neu-btn-primary"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              px: 2.5,
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Canvas'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
