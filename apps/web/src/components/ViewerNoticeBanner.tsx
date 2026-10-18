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
        bgcolor: 'rgba(245, 158, 11, 0.12)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
        px: 2,
        py: 0.65,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 40,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Chip
          icon={<VisibilityOutlined sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
          label="Viewer (Read-Only)"
          size="small"
          sx={{
            bgcolor: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid rgba(245, 158, 11, 0.4)',
          }}
        />
        <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 500, fontSize: '0.8rem' }}>
          You have view-only access. You can pan, zoom, and inspect. <b>Live edits made by editors will update on your screen in real time!</b>
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' } }}>
          Owner: {ownerName || 'Project Owner'}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          onClick={onOpenShare}
          sx={{ height: 24, fontSize: '0.7rem', textTransform: 'none', py: 0 }}
        >
          View Members
        </Button>
        <Button
          size="small"
          variant="contained"
          color="warning"
          onClick={onOpenAuth}
          sx={{ height: 24, fontSize: '0.7rem', textTransform: 'none', py: 0, fontWeight: 700 }}
        >
          Switch Account
        </Button>
      </Box>
    </Box>
  );
};
