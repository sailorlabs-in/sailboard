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
import { EditOutlined, DescriptionOutlined } from '@mui/icons-material';
import toast from 'react-hot-toast';

export interface RenameFileModalProps {
  open: boolean;
  initialTitle: string;
  onClose: () => void;
  onRename: (newTitle: string) => Promise<void>;
}

export const RenameFileModal: React.FC<RenameFileModalProps> = ({
  open,
  initialTitle,
  onClose,
  onRename,
}) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialTitle || '');
  }, [initialTitle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onRename(title.trim());
      toast.success(`Canvas renamed to "${title.trim()}"`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename canvas');
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
            Rename Canvas
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.72rem' }}>
            Change the file name of this whiteboard
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 1.5 }}>
          <Box>
            <Typography className="neu-form-label">
              Canvas Name
            </Typography>
            <TextField
              autoFocus
              placeholder="e.g. System Design Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
              required
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
            disabled={isSubmitting || !title.trim()}
            className="neu-btn-primary"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              minWidth: 100,
            }}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Rename'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
