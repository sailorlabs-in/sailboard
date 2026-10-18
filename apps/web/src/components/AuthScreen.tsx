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
} from '@mui/material';
import {
  EmailOutlined,
  LockOutlined,
  PersonOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  ArrowForwardOutlined,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [tabIndex, setTabIndex] = useState<number>(0); // 0: Sign In, 1: Register

  // Form Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (tabIndex === 0) {
        // Sign In
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password');
        }
        await login(email.trim(), password);
      } else {
        // Create Account
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in all fields to create your account');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await register(email.trim(), name.trim(), password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        bgcolor: '#090d16',
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -15%, rgba(99, 102, 241, 0.22) 0%, transparent 70%),
          radial-gradient(circle at 85% 85%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
          radial-gradient(#1e293b 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 28px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        boxSizing: 'border-box',
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
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            mb: 1.5,
          }}
        >
          ⛵
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: -0.5,
            color: '#f8fafc',
            fontSize: { xs: '1.75rem', sm: '2.1rem' },
            mb: 0.5,
          }}
        >
          Sailboard
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#94a3b8',
            maxWidth: 380,
            lineHeight: 1.5,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          Production Collaborative Engineering Canvas & Folder Workspace
        </Typography>
      </Box>

      {/* Main Glass Card */}
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: '20px',
          bgcolor: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(255, 255, 255, 0.1) inset',
          overflow: 'hidden',
        }}
      >
        {/* Segmented Control Tabs (Linear / Apple style) */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Box
            sx={{
              display: 'flex',
              bgcolor: 'rgba(10, 15, 26, 0.7)',
              p: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '4px',
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
                py: 0.8,
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                color: tabIndex === 0 ? '#ffffff' : '#94a3b8',
                bgcolor:
                  tabIndex === 0
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(59, 130, 246, 0.2) 100%)'
                    : 'transparent',
                border: tabIndex === 0 ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                boxShadow: tabIndex === 0 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                '&:hover': {
                  bgcolor: tabIndex === 0 ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                },
                transition: 'all 0.15s ease',
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
                py: 0.8,
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                color: tabIndex === 1 ? '#ffffff' : '#94a3b8',
                bgcolor:
                  tabIndex === 1
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(59, 130, 246, 0.2) 100%)'
                    : 'transparent',
                border: tabIndex === 1 ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                boxShadow: tabIndex === 1 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                '&:hover': {
                  bgcolor: tabIndex === 1 ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                },
                transition: 'all 0.15s ease',
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

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tabIndex === 1 && (
              <Box>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.6, display: 'block' }}>
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
                          <PersonOutlined sx={{ color: '#64748b', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                      '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1.5px' },
                    },
                    '& input::placeholder': { color: '#64748b', opacity: 1 },
                  }}
                />
              </Box>
            )}

            <Box>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.6, display: 'block' }}>
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
                        <EmailOutlined sx={{ color: '#64748b', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1.5px' },
                  },
                  '& input::placeholder': { color: '#64748b', opacity: 1 },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.6, display: 'block' }}>
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
                        <LockOutlined sx={{ color: '#64748b', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          sx={{ color: '#64748b' }}
                        >
                          {showPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1.5px' },
                  },
                  '& input::placeholder': { color: '#64748b', opacity: 1 },
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              endIcon={!loading && <ArrowForwardOutlined />}
              sx={{
                mt: 1,
                py: 1.2,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.55)',
                },
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
          Sailboard • PostgreSQL, TypeORM, Redis Pub/Sub & WebSockets
        </Typography>
      </Box>
    </Box>
  );
};
