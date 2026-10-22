import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { VisibilityOutlined, ChatBubbleOutlined } from '@mui/icons-material';
import { ProjectRole } from '@rea/shared-types';

interface ViewerNoticeBannerProps {
  ownerName: string;
  userRole?: ProjectRole;
  onOpenShare: () => void;
  onOpenAuth: () => void;
  onOpenAccountManage?: () => void;
}

export function ViewerNoticeBanner({
  ownerName,
  userRole = 'viewer',
  onOpenShare,
  onOpenAuth,
  onOpenAccountManage,
}: ViewerNoticeBannerProps) {
  const isCommenter = userRole === 'commenter';

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
        {isCommenter ? (
          <Chip
            icon={<ChatBubbleOutlined sx={{ fontSize: '14px !important', color: '#06b6d4 !important' }} />}
            label="Commenter"
            size="small"
            sx={{
              bgcolor: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              fontWeight: 700,
              fontSize: '0.72rem',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: 'var(--neu-shadow-btn)',
            }}
          />
        ) : (
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
        )}
        <Typography variant="caption" sx={{ color: 'var(--neu-text-primary)', fontWeight: 500, fontSize: '0.8rem' }}>
          {isCommenter ? (
            <>
              You have Commenter access — you can review, leave comment pins, reply, and resolve discussions. <b>Canvas elements and notes are read-only.</b>
            </>
          ) : (
            <>
              You have view-only access. You can pan, zoom, and inspect. <b>Live edits made by editors will update on your screen in real time!</b>
            </>
          )}
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
          onClick={onOpenAccountManage || onOpenAuth}
          className="neu-btn-primary"
          sx={{ height: 26, fontSize: '0.7rem', textTransform: 'none', px: 1.2, fontWeight: 700, borderRadius: '6px' }}
        >
          Switch Account
        </Button>
      </Box>
    </Box>
  );
}
