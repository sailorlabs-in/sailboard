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
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  CloseOutlined,
  PersonOutlined,
  LockOutlined,
  EmailOutlined,
  SailingOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (tabIndex === 1) {
      if (!email.trim() || !name.trim() || !password) {
        const msg = 'All fields are required';
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }
      if (password.length < 6) {
        const msg = 'Password must be at least 6 characters';
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }
      if (password !== confirmPassword) {
        const msg = 'Passwords do not match';
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }
    } else {
      if (!email.trim() || !password) {
        const msg = 'Email and password are required';
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }
    }

    setLoading(true);

    try {
      if (tabIndex === 0) {
        // Sign In
        await login(email.trim(), password);
        toast.success('Signed in successfully!');
      } else if (tabIndex === 1) {
        // Register
        await register(email.trim(), name.trim(), password);
        toast.success('Account created successfully!');
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Authentication failed';
      setErrorMsg(msg);
      toast.error(msg);
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
          className: 'neu-floating',
          sx: {
            borderRadius: '20px',
            bgcolor: 'var(--neu-surface)',
            border: 'var(--neu-border)',
            boxShadow: 'var(--neu-shadow-floating)',
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
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--neu-primary-glow)',
            }}
          >
            <SailingOutlined sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'var(--neu-text-primary)' }}>
              Sailboard Account
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)' }}>
              Production Collaborative Workspace
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} className="neu-icon-btn" sx={{ width: 30, height: 30 }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pt: 1 }}>
        <Box className="neu-segmented" sx={{ width: '100%', display: 'flex' }}>
          <button
            type="button"
            className={`neu-segmented-item ${tabIndex === 0 ? 'active' : ''}`}
            onClick={() => {
              setTabIndex(0);
              setErrorMsg(null);
            }}
            style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`neu-segmented-item ${tabIndex === 1 ? 'active' : ''}`}
            onClick={() => {
              setTabIndex(1);
              setErrorMsg(null);
            }}
            style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
          >
            Create Account
          </button>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 2.5, pb: 2 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabIndex === 1 && (
            <Box>
              <Typography className="neu-form-label">
                Full Name
              </Typography>
              <TextField
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlined sx={{ color: 'var(--neu-text-secondary)', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          )}

          <Box>
            <Typography className="neu-form-label">
              Work Email
            </Typography>
            <TextField
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={{ color: 'var(--neu-text-secondary)', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            <Typography className="neu-form-label">
              Password
            </Typography>
            <TextField
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: 'var(--neu-text-secondary)', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((p) => !p)}
                        edge="end"
                        disableRipple
                        sx={{ color: 'var(--neu-text-secondary)', '&:hover': { color: 'var(--neu-text-primary)' } }}
                      >
                        {showPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {tabIndex === 1 && (
            <Box>
              <Typography className="neu-form-label">
                Confirm Password
              </Typography>
              <TextField
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: 'var(--neu-text-secondary)', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          edge="end"
                          disableRipple
                          sx={{ color: 'var(--neu-text-secondary)', '&:hover': { color: 'var(--neu-text-primary)' } }}
                        >
                          {showConfirmPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            className="neu-btn-primary"
            sx={{ mt: 1, py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: '10px' }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : tabIndex === 0 ? (
              'Sign In to Sailboard'
            ) : (
              'Create Account & Start'
            )}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)' }}>
          Sailboard Monorepo • Redis & PostgreSQL Engine
        </Typography>
        <Button onClick={onClose} size="small" sx={{ color: 'var(--neu-text-secondary)' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
