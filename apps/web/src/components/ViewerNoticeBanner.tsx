import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { VisibilityOutlined, SecurityOutlined } from '@mui/icons-material';

interface ViewerNoticeBannerProps {
  ownerName: string;
  onOpenShare: () => void;
  onOpenAuth: () => void;
}

export const ViewerNoticeBanner: React.FC<ViewerNoticeBannerProps> = ({
  ownerName,
  onOpenShare,
  onOpenAuth,
}) => {
  return (
    <Box
      sx={{
        bgcolor: 'var(--neu-surface)',
        borderBottom: 'var(--neu-border)',
        boxShadow: 'var(--neu-shadow-raised-sm)',
        px: 2,
        py: 0.8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 40,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Chip
          icon={<VisibilityOutlined sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
          label="Viewer (Read-Only)"
          size="small"
          sx={{
            bgcolor: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: 'var(--neu-shadow-btn)',
          }}
        />
        <Typography variant="caption" sx={{ color: 'var(--neu-text-primary)', fontWeight: 500, fontSize: '0.8rem' }}>
          You have view-only access. You can pan, zoom, and inspect. <b>Live edits made by editors will update on your screen in real time!</b>
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', display: { xs: 'none', md: 'block' } }}>
          Owner: {ownerName || 'Project Owner'}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={onOpenShare}
          className="neu-btn"
          sx={{ height: 26, fontSize: '0.7rem', textTransform: 'none', px: 1.2, borderRadius: '6px' }}
        >
          View Members
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={onOpenAuth}
          className="neu-btn-primary"
          sx={{ height: 26, fontSize: '0.7rem', textTransform: 'none', px: 1.2, fontWeight: 700, borderRadius: '6px' }}
        >
          Switch Account
        </Button>
      </Box>
    </Box>
  );
};
