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
  const { login, register, loginAsDemo } = useAuth();
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDemoLogin = async (type: 'alice' | 'bob') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginAsDemo(type);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (tabIndex === 1) {
        // Sign In
        if (!email || !password) throw new Error('Email and password are required');
        await login(email, password);
      } else if (tabIndex === 2) {
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
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
              width: 38,
              height: 38,
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
              Sailboard Authentication
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Production Collaborative Canvas & Folder Workspace
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
          <Tab label="⚡ Quick Demo Accounts" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
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

        {tabIndex === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Select a pre-seeded account to instantly test multiplayer collaboration, folders with multiple files, and role-based sharing:
            </Typography>

            {/* Alice Card */}
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2.5,
                borderColor: 'primary.main',
                bgcolor: 'rgba(99, 102, 241, 0.05)',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(99,102,241,0.2)' },
              }}
            >
              <CardActionArea onClick={() => handleDemoLogin('alice')} disabled={loading} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#6366f1', width: 48, height: 48, fontWeight: 700 }}>
                    AW
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Alice Walker
                      </Typography>
                      <Chip
                        icon={<AdminPanelSettingsOutlined sx={{ fontSize: '14px !important' }} />}
                        label="Project Owner"
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      alice@sailboard.io • Password: <code>password123</code>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Owns "Sailboard Core Architecture" (Files A, B, C). Can invite members, assign Editor/Viewer roles, and edit canvas.
                    </Typography>
                  </Box>
                  <Button variant="contained" size="small" sx={{ textTransform: 'none', px: 2 }}>
                    Login as Owner
                  </Button>
                </Box>
              </CardActionArea>
            </Card>

            {/* Bob Card */}
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2.5,
                borderColor: 'secondary.main',
                bgcolor: 'rgba(236, 72, 153, 0.05)',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(236,72,153,0.2)' },
              }}
            >
              <CardActionArea onClick={() => handleDemoLogin('bob')} disabled={loading} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#ec4899', width: 48, height: 48, fontWeight: 700 }}>
                    BM
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Bob Martinez
                      </Typography>
                      <Chip
                        icon={<GroupOutlined sx={{ fontSize: '14px !important' }} />}
                        label="Collaborator (Editor/Viewer)"
                        size="small"
                        color="secondary"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      bob@sailboard.io • Password: <code>password123</code>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Collaborator on Alice's project. Edits sync live to Alice! Switch Bob's permission to Viewer to test read-only mode.
                    </Typography>
                  </Box>
                  <Button variant="outlined" color="secondary" size="small" sx={{ textTransform: 'none', px: 2 }}>
                    Login as Bob
                  </Button>
                </Box>
              </CardActionArea>
            </Card>
          </Box>
        )}

        {(tabIndex === 1 || tabIndex === 2) && (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tabIndex === 2 && (
              <TextField
                label="Full Name"
                placeholder="e.g. Charlie Parker"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <PersonOutlined sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
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
              InputProps={{
                startAdornment: <EmailOutlined sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
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
              InputProps={{
                startAdornment: <LockOutlined sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
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
        )}
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
