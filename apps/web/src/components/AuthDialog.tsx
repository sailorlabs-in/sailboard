import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  CloseOutlined,
  PersonOutlined,
  LockOutlined,
  EmailOutlined,
  AdminPanelSettingsOutlined,
  GroupOutlined,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const [tabIndex, setTabIndex] = useState<number>(0); // 0 = Sign In, 1 = Create Account

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (tabIndex === 0) {
        // Sign In
        if (!email || !password) throw new Error('Email and password are required');
        await login(email, password);
      } else if (tabIndex === 1) {
        // Register
        if (!email || !name || !password) throw new Error('All fields are required');
        await register(email, name, password);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>
              ⛵
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Sailboard Account
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Production Collaborative Workspace
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => {
            setTabIndex(v);
            setErrorMsg(null);
          }}
          textColor="primary"
          indicatorColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 44 }}
        >
          <Tab label="Sign In" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
          <Tab label="Create Account" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2.5, pb: 2 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabIndex === 1 && (
            <TextField
              label="Full Name"
              placeholder="e.g. Charlie Parker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: <PersonOutlined sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
                },
              }}
            />
          )}
            <TextField
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: <EmailOutlined sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
                },
              }}
            />
            <TextField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: <LockOutlined sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 1, py: 1, fontWeight: 700, textTransform: 'none' }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : tabIndex === 1 ? (
                'Sign In to Sailboard'
              ) : (
                'Create Account & Start'
              )}
            </Button>
          </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Sailboard Monorepo • Redis & PostgreSQL Engine
        </Typography>
        <Button onClick={onClose} color="inherit" size="small">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
