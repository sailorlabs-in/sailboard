import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import { WarningAmberOutlined } from '@mui/icons-material';

export interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  itemName?: string;
  itemType?: string;
  warningText?: string;
  isDeleting?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  title,
  itemName,
  itemType = 'canvas',
  warningText = 'This action is permanent and cannot be undone.',
  isDeleting = false,
  onConfirm,
  onClose,
}) => {
  const [internalDeleting, setInternalDeleting] = useState(false);

  const handleConfirm = async () => {
    setInternalDeleting(true);
    try {
      await onConfirm();
    } finally {
      setInternalDeleting(false);
    }
  };

  const loading = isDeleting || internalDeleting;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '18px',
            p: 1,
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
            width: 42,
            height: 42,
            borderRadius: '10px',
            bgcolor: 'rgba(239, 68, 68, 0.12)',
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <WarningAmberOutlined />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
            {title || `Delete ${itemType}?`}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Irreversible operation
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 1.5 }}>
        <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>
          Are you sure you want to permanently delete{' '}
          {itemName ? <strong>"{itemName}"</strong> : `this ${itemType}`}?
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', bgcolor: 'rgba(239, 68, 68, 0.06)', p: 1, borderRadius: 1.5, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          ⚠️ {warningText}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: '8px',
            px: 2.5,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
          }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
