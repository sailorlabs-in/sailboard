import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  CloseOutlined,
  ManageAccountsOutlined,
  PersonAddAlt1Outlined,
  SwapHorizOutlined,
  DeleteOutlineOutlined,
  CheckOutlined,
  PersonOutlined,
  EmailOutlined,
  PaletteOutlined,
  LogoutOutlined,
  LockOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { animateTabTransition } from '../utils/animations';

interface AccountManageDialogProps {
  open: boolean;
  onClose: () => void;
  onAddAccountClick: () => void;
}

const PALETTE_COLORS = [
  { label: 'Indigo', hex: '#6366f1' },
  { label: 'Ocean Blue', hex: '#3b82f6' },
  { label: 'Cyan', hex: '#06b6d4' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Amber', hex: '#f59e0b' },
  { label: 'Pink Rose', hex: '#ec4899' },
  { label: 'Purple', hex: '#8b5cf6' },
  { label: 'Ruby Red', hex: '#ef4444' },
];

export const AccountManageDialog: React.FC<AccountManageDialogProps> = ({
  open,
  onClose,
  onAddAccountClick,
}) => {
  const {
    user,
    accounts,
    switchAccount,
    removeAccount,
    updateProfile,
    logout,
    logoutAll,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'switch' | 'profile' | 'security'>('switch');
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileColor, setProfileColor] = useState(user?.color || '#6366f1');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password / Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileColor(user.color || '#6366f1');
    }
  }, [user, open]);

  const handleSwitch = async (targetUserId: string, targetName: string) => {
    try {
      setSwitchingId(targetUserId);
      await switchAccount(targetUserId);
      toast.success(`Switched to account: ${targetName}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch account');
    } finally {
      setSwitchingId(null);
    }
  };

  const handleRemove = (targetUserId: string, targetName: string) => {
    removeAccount(targetUserId);
    toast.success(`Removed ${targetName} from this device`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile({
        name: profileName.trim(),
        color: profileColor,
      });
      toast.success('Profile updated successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setActiveTab('switch');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password. Verify current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const otherAccounts = accounts.filter((a) => a.user.id !== user?.id);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (dialogContentRef.current) {
      animateTabTransition(dialogContentRef.current, 'right');
    }
  }, [activeTab]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          className: 'neu-floating',
          sx: {
            borderRadius: '20px',
            bgcolor: 'var(--neu-surface)',
            border: 'var(--neu-border)',
            boxShadow: 'var(--neu-shadow-floating)',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1.5,
          pt: 2.5,
          px: 3,
          borderBottom: 'var(--neu-border-subtle)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--neu-primary-glow)',
            }}
          >
            <ManageAccountsOutlined sx={{ color: '#ffffff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'var(--neu-text-primary)' }}>
              Manage Account & Profiles
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.75rem' }}>
              Multi-account workspace switching & profile configuration
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} className="neu-icon-btn" sx={{ width: 32, height: 32 }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Segmented Control Navigation */}
      <Box sx={{ px: 3, pt: 2 }}>
        <Box className="neu-segmented" sx={{ width: '100%', display: 'flex' }}>
          <button
            type="button"
            className={`neu-segmented-item ${activeTab === 'switch' ? 'active' : ''}`}
            onClick={() => setActiveTab('switch')}
            style={{ flex: 1, padding: '9px', fontSize: '0.85rem', fontWeight: 600 }}
          >
            Switch Account ({accounts.length})
          </button>
          <button
            type="button"
            className={`neu-segmented-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{ flex: 1, padding: '9px', fontSize: '0.85rem', fontWeight: 600 }}
          >
            Edit Profile
          </button>
          <button
            type="button"
            className={`neu-segmented-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            style={{ flex: 1, padding: '9px', fontSize: '0.85rem', fontWeight: 600 }}
          >
            Security & Password
          </button>
        </Box>
      </Box>

      {/* Content Area */}
      <DialogContent ref={dialogContentRef} sx={{ px: 3, py: 2.5, minHeight: 340 }}>
        {activeTab === 'switch' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Active Account Hero Card */}
            {user ? (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--neu-text-secondary)', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                  ACTIVE ACCOUNT
                </Typography>
                <Box
                  className="neu-inset"
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    bgcolor: 'var(--neu-bg)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, overflow: 'hidden' }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: user.color || 'var(--neu-primary)',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        boxShadow: 'var(--neu-shadow-raised-sm)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {user.name.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: 'var(--neu-text-primary)' }}>
                          {user.name}
                        </Typography>
                        <Chip
                          label="Current Active"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        />
                      </Box>
                      <Typography variant="caption" noWrap sx={{ color: 'var(--neu-text-secondary)', display: 'block' }}>
                        {user.email}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--neu-text-tertiary)', fontSize: '0.68rem' }}>
                        ID: {user.id}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setActiveTab('profile')}
                    className="neu-btn"
                    sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', px: 1.5, py: 0.5, flexShrink: 0 }}
                  >
                    Edit
                  </Button>
                </Box>
              </Box>
            ) : null}

            {/* Other Accounts on this Device */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--neu-text-secondary)', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                SWITCH TO ANOTHER ACCOUNT ({otherAccounts.length})
              </Typography>

              {otherAccounts.length === 0 ? (
                <Box
                  className="neu-inset"
                  sx={{
                    p: 2.5,
                    borderRadius: '14px',
                    textAlign: 'center',
                    color: 'var(--neu-text-secondary)',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    No other accounts saved on this device
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', maxWidth: 360, mx: 'auto' }}>
                    Add another account (e.g., secondary work profile, client account, or test user) to switch between them seamlessly.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {otherAccounts.map((account) => {
                    const isSwitching = switchingId === account.user.id;
                    return (
                      <Box
                        key={account.user.id}
                        className="neu-card"
                        sx={{
                          p: 1.5,
                          borderRadius: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          bgcolor: 'var(--neu-surface)',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            borderColor: 'var(--neu-primary)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: account.user.color || '#6366f1',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              boxShadow: 'var(--neu-shadow-btn)',
                            }}
                          >
                            {account.user.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'var(--neu-text-primary)' }}>
                              {account.user.name}
                            </Typography>
                            <Typography variant="caption" noWrap sx={{ color: 'var(--neu-text-secondary)', display: 'block', fontSize: '0.72rem' }}>
                              {account.user.email}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={isSwitching}
                            onClick={() => handleSwitch(account.user.id, account.user.name)}
                            startIcon={isSwitching ? <CircularProgress size={14} color="inherit" /> : <SwapHorizOutlined fontSize="small" />}
                            className="neu-btn-primary"
                            sx={{
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              px: 1.4,
                              py: 0.6,
                            }}
                          >
                            Switch
                          </Button>
                          <Tooltip title="Remove account from device">
                            <IconButton
                              size="small"
                              onClick={() => handleRemove(account.user.id, account.user.name)}
                              className="neu-icon-btn"
                              sx={{ width: 32, height: 32, color: 'error.main' }}
                            >
                              <DeleteOutlineOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* "+ Add Another Account" Trigger */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                onClose();
                onAddAccountClick();
              }}
              startIcon={<PersonAddAlt1Outlined />}
              className="neu-btn"
              sx={{
                py: 1.2,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                borderStyle: 'dashed',
                borderWidth: '1.5px',
              }}
            >
              Add Another Account to Device
            </Button>
          </Box>
        )}

        {activeTab === 'profile' && (
          /* Profile Settings Tab */
          <Box component="form" onSubmit={handleSaveProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Live Avatar Preview */}
            <Box
              className="neu-inset"
              sx={{
                p: 2,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'var(--neu-bg)',
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: profileColor,
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  boxShadow: 'var(--neu-shadow-raised)',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {profileName ? profileName.slice(0, 2).toUpperCase() : 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--neu-text-primary)' }}>
                  {profileName || 'Your Name'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', display: 'block' }}>
                  {user?.email}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--neu-primary-light)', fontSize: '0.7rem', fontWeight: 600 }}>
                  This color identifies your cursor & selections during live collaboration.
                </Typography>
              </Box>
            </Box>

            {/* Display Name Input */}
            <Box>
              <Typography className="neu-form-label">
                Display Name
              </Typography>
              <TextField
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter full name"
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

            {/* Email (Read-only) */}
            <Box>
              <Typography className="neu-form-label">
                Account Email (Primary Key)
              </Typography>
              <TextField
                value={user?.email || ''}
                disabled
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

            {/* Color Palette Picker */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PaletteOutlined fontSize="small" sx={{ color: 'var(--neu-text-secondary)' }} />
                <Typography className="neu-form-label" sx={{ mb: '0 !important' }}>
                  Collaboration Accent Color
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                {PALETTE_COLORS.map((col) => {
                  const isSelected = profileColor.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <Tooltip key={col.hex} title={col.label}>
                      <Box
                        onClick={() => setProfileColor(col.hex)}
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '10px',
                          bgcolor: col.hex,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected
                            ? `0 0 0 3px var(--neu-surface), 0 0 0 5px ${col.hex}`
                            : 'var(--neu-shadow-btn)',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            transform: 'scale(1.08)',
                          },
                        }}
                      >
                        {isSelected && <CheckOutlined sx={{ color: '#ffffff', fontSize: 18, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSavingProfile}
              className="neu-btn-primary"
              sx={{
                py: 1.2,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                mt: 1,
              }}
            >
              {isSavingProfile ? <CircularProgress size={20} color="inherit" /> : 'Save Profile Changes'}
            </Button>
          </Box>
        )}

        {activeTab === 'security' && (
          <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--neu-text-primary)', mb: 0.5 }}>
                Account Security & Password
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', display: 'block', mb: 1 }}>
                Update your account password to keep your workspaces secure.
              </Typography>
            </Box>

            <Box>
              <Typography className="neu-form-label">
                Current Password
              </Typography>
              <TextField
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          edge="end"
                          disableRipple
                          sx={{ color: 'var(--neu-text-secondary)', '&:hover': { color: 'var(--neu-text-primary)' } }}
                        >
                          {showCurrentPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Box>
              <Typography className="neu-form-label">
                New Password (minimum 6 characters)
              </Typography>
              <TextField
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          edge="end"
                          disableRipple
                          sx={{ color: 'var(--neu-text-secondary)', '&:hover': { color: 'var(--neu-text-primary)' } }}
                        >
                          {showNewPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Box>
              <Typography className="neu-form-label">
                Confirm New Password
              </Typography>
              <TextField
                type="password"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isChangingPassword}
              className="neu-btn-primary"
              sx={{
                py: 1.2,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                mt: 1,
              }}
            >
              {isChangingPassword ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
            </Button>
          </Box>
        )}
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          justifyContent: 'space-between',
          borderTop: 'var(--neu-border-subtle)',
          bgcolor: 'var(--neu-surface)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            color="error"
            startIcon={<LogoutOutlined fontSize="small" />}
            onClick={() => {
              onClose();
              logout();
              toast.success('Signed out of current account');
            }}
            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
          >
            Sign Out
          </Button>
          {accounts.length > 1 && (
            <Button
              size="small"
              color="error"
              onClick={() => {
                onClose();
                logoutAll();
                toast.success('Signed out of all accounts on this device');
              }}
              sx={{ textTransform: 'none', fontSize: '0.72rem', opacity: 0.8 }}
            >
              Sign Out All ({accounts.length})
            </Button>
          )}
        </Box>

        <Button onClick={onClose} size="small" className="neu-btn" sx={{ textTransform: 'none', px: 2, borderRadius: '8px' }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
