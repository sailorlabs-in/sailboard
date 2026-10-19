import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  EmailOutlined,
  LockOutlined,
  PersonOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  ArrowForwardOutlined,
  SailingOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [tabIndex, setTabIndex] = useState<number>(0); // 0: Sign In, 1: Register

  // Form Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (tabIndex === 1) {
      if (!name.trim() || !email.trim() || !password) {
        const msg = 'Please fill in all fields to create your account';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
      if (password.length < 6) {
        const msg = 'Password must be at least 6 characters';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
      if (password !== confirmPassword) {
        const msg = 'Passwords do not match. Please verify your password.';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
    } else {
      if (!email.trim() || !password) {
        const msg = 'Please enter both email and password';
        setErrorMessage(msg);
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
      } else {
        // Create Account
        await register(email.trim(), name.trim(), password);
        toast.success('Account created successfully! Welcome to Sailboard.');
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        bgcolor: 'var(--neu-bg)',
        color: 'var(--neu-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        boxSizing: 'border-box',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5, textAlign: 'center' }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            boxShadow: 'var(--neu-shadow-btn), 0 8px 24px var(--neu-primary-glow)',
            mb: 1.5,
          }}
        >
          <SailingOutlined sx={{ fontSize: 30, color: '#fff' }} />
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: -0.5,
            color: 'var(--neu-text-primary)',
            fontSize: { xs: '1.75rem', sm: '2.1rem' },
            mb: 0.5,
          }}
        >
          Sailboard
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'var(--neu-text-secondary)',
            maxWidth: 380,
            lineHeight: 1.5,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          Production Collaborative Engineering Canvas & Folder Workspace
        </Typography>
      </Box>

      {/* Main Neumorphic Card */}
      <Card
        className="neu-floating"
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: '20px',
          bgcolor: 'var(--neu-surface)',
          border: 'var(--neu-border)',
          boxShadow: 'var(--neu-shadow-floating)',
          overflow: 'hidden',
        }}
      >
        {/* Segmented Control Tabs */}
        <Box sx={{ p: 2.5, pb: 0 }}>
          <Box
            className="neu-segmented"
            sx={{
              display: 'flex',
              bgcolor: 'var(--neu-bg)',
              boxShadow: 'var(--neu-shadow-inset)',
              border: 'var(--neu-border-inset)',
              p: '5px',
              borderRadius: '14px',
              gap: '6px',
            }}
          >
            <Button
              fullWidth
              size="small"
              onClick={() => {
                setTabIndex(0);
                setErrorMessage(null);
              }}
              sx={{
                py: 0.9,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                color: tabIndex === 0 ? 'var(--neu-primary-light)' : 'var(--neu-text-secondary)',
                bgcolor: tabIndex === 0 ? 'var(--neu-surface)' : 'transparent',
                border: tabIndex === 0 ? 'var(--neu-border)' : '1px solid transparent',
                boxShadow: tabIndex === 0 ? 'var(--neu-shadow-btn)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              size="small"
              onClick={() => {
                setTabIndex(1);
                setErrorMessage(null);
              }}
              sx={{
                py: 0.9,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                color: tabIndex === 1 ? 'var(--neu-primary-light)' : 'var(--neu-text-secondary)',
                bgcolor: tabIndex === 1 ? 'var(--neu-surface)' : 'transparent',
                border: tabIndex === 1 ? 'var(--neu-border)' : '1px solid transparent',
                boxShadow: tabIndex === 1 ? 'var(--neu-shadow-btn)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              Create Account
            </Button>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          {errorMessage && (
            <Alert
              severity="error"
              onClose={() => setErrorMessage(null)}
              sx={{
                mb: 2.5,
                borderRadius: '10px',
                fontSize: '0.825rem',
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              {errorMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            {tabIndex === 1 && (
              <Box>
                <Typography className="neu-form-label">
                  Full Name
                </Typography>
                <TextField
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  size="small"
                  required
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
                fullWidth
                size="small"
                required
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
                fullWidth
                size="small"
                required
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
                          onClick={() => setShowPassword((prev) => !prev)}
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
                  fullWidth
                  size="small"
                  required
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
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
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
              endIcon={!loading && <ArrowForwardOutlined />}
              className="neu-btn-primary"
              sx={{
                mt: 1,
                py: 1.3,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.92rem',
                textTransform: 'none',
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : tabIndex === 0 ? (
                'Sign In'
              ) : (
                'Create Account & Start'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
          Sailboard • Production Engineering & Architecture Workspace
        </Typography>
      </Box>
    </Box>
  );
};
