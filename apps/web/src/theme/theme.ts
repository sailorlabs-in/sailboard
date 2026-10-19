import { createTheme, ThemeOptions } from '@mui/material/styles';

export type ThemePreference = 'light' | 'dark' | 'system';

export const getNeumorphicStyles = (isDark: boolean) => ({
  flat: {
    bgcolor: isDark ? '#181d2c' : '#e8eef6',
    boxShadow: isDark
      ? '6px 6px 16px rgba(0, 0, 0, 0.65), -5px -5px 14px rgba(255, 255, 255, 0.04)'
      : '6px 6px 14px rgba(163, 177, 198, 0.6), -6px -6px 14px rgba(255, 255, 255, 0.95)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(255, 255, 255, 0.85)',
  },
  card: {
    bgcolor: isDark ? '#161b2a' : '#e4eaf3',
    boxShadow: isDark
      ? '6px 6px 16px rgba(0, 0, 0, 0.65), -5px -5px 14px rgba(255, 255, 255, 0.04)'
      : '6px 6px 14px rgba(163, 177, 198, 0.6), -6px -6px 14px rgba(255, 255, 255, 0.95)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(255, 255, 255, 0.85)',
    borderRadius: '16px',
    transition: 'box-shadow 0.25s ease, background-color 0.2s ease',
    '&:hover': {
      boxShadow: isDark
        ? '10px 10px 24px rgba(0, 0, 0, 0.75), -8px -8px 20px rgba(255, 255, 255, 0.05)'
        : '10px 10px 22px rgba(163, 177, 198, 0.7), -10px -10px 22px rgba(255, 255, 255, 1)',
      bgcolor: isDark ? '#1c2234' : '#ecf1f8',
    },
  },
  inset: {
    bgcolor: isDark ? '#121622' : '#e2e8f0',
    boxShadow: isDark
      ? 'inset 3px 3px 7px rgba(0, 0, 0, 0.7), inset -2px -2px 6px rgba(255, 255, 255, 0.035)'
      : 'inset 3px 3px 6px rgba(163, 177, 198, 0.55), inset -3px -3px 6px rgba(255, 255, 255, 0.95)',
    border: isDark ? '1px solid rgba(0, 0, 0, 0.4)' : '1px solid rgba(163, 177, 198, 0.4)',
  },
  active: {
    bgcolor: isDark ? '#121622' : '#e2e8f0',
    boxShadow: isDark
      ? 'inset 4px 4px 9px rgba(0, 0, 0, 0.8), inset -3px -3px 6px rgba(255, 255, 255, 0.04), 0 0 12px rgba(99, 102, 241, 0.35)'
      : 'inset 4px 4px 8px rgba(163, 177, 198, 0.7), inset -3px -3px 6px rgba(255, 255, 255, 0.95), 0 0 10px rgba(79, 70, 229, 0.25)',
    color: isDark ? '#818cf8' : '#4f46e5',
  },
  dock: {
    bgcolor: isDark ? 'rgba(24, 29, 44, 0.92)' : 'rgba(232, 238, 246, 0.92)',
    backdropFilter: 'blur(14px)',
    boxShadow: isDark
      ? '8px 8px 22px rgba(0, 0, 0, 0.7), -6px -6px 18px rgba(255, 255, 255, 0.04)'
      : '8px 8px 20px rgba(163, 177, 198, 0.6), -8px -8px 20px rgba(255, 255, 255, 0.95)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(255, 255, 255, 0.85)',
  },
  button: {
    bgcolor: isDark ? '#181d2c' : '#e8eef6',
    boxShadow: isDark
      ? '4px 4px 10px rgba(0, 0, 0, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.035)'
      : '4px 4px 10px rgba(163, 177, 198, 0.55), -4px -4px 10px rgba(255, 255, 255, 0.95)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(255, 255, 255, 0.85)',
    transition: 'all 0.15s ease',
    '&:hover': {
      boxShadow: isDark
        ? '2px 2px 6px rgba(0, 0, 0, 0.65), -2px -2px 5px rgba(255, 255, 255, 0.05)'
        : '2px 2px 6px rgba(163, 177, 198, 0.65), -2px -2px 6px rgba(255, 255, 255, 1)',
    },
    '&:active': {
      boxShadow: isDark
        ? 'inset 2px 2px 5px rgba(0, 0, 0, 0.75), inset -2px -2px 4px rgba(255, 255, 255, 0.035)'
        : 'inset 2px 2px 5px rgba(163, 177, 198, 0.65), inset -2px -2px 5px rgba(255, 255, 255, 0.9)',
      transform: 'scale(0.98)',
    },
  },
});

export const getAppTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isDark ? '#6366f1' : '#4f46e5',
        light: isDark ? '#818cf8' : '#6366f1',
        dark: isDark ? '#4338ca' : '#3730a3',
      },
      secondary: {
        main: '#ec4899',
      },
      background: {
        default: isDark ? '#121622' : '#e2e8f0',
        paper: isDark ? '#181d2c' : '#e8eef6',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(163, 177, 198, 0.35)',
    },
    typography: {
      fontFamily: `'Teachers', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 14,
            backgroundColor: isDark ? '#181d2c' : '#e8eef6',
            boxShadow: isDark
              ? '6px 6px 16px rgba(0, 0, 0, 0.65), -5px -5px 14px rgba(255, 255, 255, 0.04)'
              : '6px 6px 14px rgba(163, 177, 198, 0.6), -6px -6px 14px rgba(255, 255, 255, 0.95)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(255, 255, 255, 0.85)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#161b2a' : '#e4eaf3',
            boxShadow: isDark
              ? '6px 6px 16px rgba(0, 0, 0, 0.65), -5px -5px 14px rgba(255, 255, 255, 0.04)'
              : '6px 6px 14px rgba(163, 177, 198, 0.6), -6px -6px 14px rgba(255, 255, 255, 0.95)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(255, 255, 255, 0.85)',
            borderRadius: 16,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#181d2c' : '#e8eef6',
            boxShadow: isDark
              ? '12px 12px 30px rgba(0, 0, 0, 0.75), -8px -8px 24px rgba(255, 255, 255, 0.04)'
              : '10px 10px 24px rgba(163, 177, 198, 0.65), -10px -10px 24px rgba(255, 255, 255, 1)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.85)',
            borderRadius: 16,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#181d2c' : '#e8eef6',
            boxShadow: isDark
              ? '8px 8px 24px rgba(0, 0, 0, 0.7), -6px -6px 18px rgba(255, 255, 255, 0.04)'
              : '8px 8px 20px rgba(163, 177, 198, 0.65), -8px -8px 20px rgba(255, 255, 255, 0.95)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.85)',
            borderRadius: 14,
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
          disableTouchRipple: true,
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.85rem',
            fontWeight: 700,
            color: isDark ? '#94a3b8' : '#64748b',
            marginBottom: 6,
            '&.Mui-focused': {
              color: isDark ? '#818cf8' : '#4f46e5',
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#0f131f' : '#dce3ed',
            boxShadow: isDark
              ? 'inset 3px 3px 6px rgba(0, 0, 0, 0.75), inset -2px -2px 6px rgba(255, 255, 255, 0.035)'
              : 'inset 3px 3px 6px rgba(163, 177, 198, 0.65), inset -3px -3px 6px rgba(255, 255, 255, 0.95)',
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(163, 177, 198, 0.4)',
              borderWidth: '1px !important',
              transition: 'all 0.2s ease',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(99, 102, 241, 0.45)' : 'rgba(79, 70, 229, 0.45)',
            },
            '&.Mui-focused': {
              boxShadow: isDark
                ? 'inset 3px 3px 6px rgba(0, 0, 0, 0.85), 0 0 10px rgba(99, 102, 241, 0.35)'
                : 'inset 3px 3px 6px rgba(163, 177, 198, 0.7), 0 0 10px rgba(79, 70, 229, 0.3)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? '#6366f1 !important' : '#4f46e5 !important',
                borderWidth: '1.5px !important',
              },
            },
            '&.MuiInputBase-multiline': {
              padding: '10px 14px',
            },
            '& .MuiOutlinedInput-input': {
              padding: '12px 14px',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: isDark ? '#f8fafc' : '#1e293b',
              '&.MuiOutlinedInput-inputMultiline': {
                padding: '0 !important',
              },
              '&::placeholder': {
                color: isDark ? '#64748b' : '#94a3b8',
                opacity: 1,
              },
              '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
                WebkitBoxShadow: `0 0 0 1000px ${isDark ? '#0f131f' : '#dce3ed'} inset !important`,
                boxShadow: `0 0 0 1000px ${isDark ? '#0f131f' : '#dce3ed'} inset !important`,
                WebkitTextFillColor: `${isDark ? '#f8fafc' : '#1e293b'} !important`,
                caretColor: `${isDark ? '#f8fafc' : '#1e293b'} !important`,
                borderRadius: '0 !important',
                transition: 'background-color 5000s ease-in-out 0s !important',
              },
            },
            '& .MuiInputAdornment-root': {
              color: isDark ? '#94a3b8' : '#64748b',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
          },
          contained: {
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: isDark
              ? '4px 4px 12px rgba(0, 0, 0, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(99, 102, 241, 0.35)'
              : '4px 4px 12px rgba(163, 177, 198, 0.6), -4px -4px 12px #ffffff, 0 4px 12px rgba(79, 70, 229, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              boxShadow: '0 6px 16px rgba(99, 102, 241, 0.45)',
            },
          },
          outlined: {
            backgroundColor: isDark ? '#181d2c' : '#e8eef6',
            boxShadow: isDark
              ? '3px 3px 8px rgba(0, 0, 0, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.03)'
              : '3px 3px 8px rgba(163, 177, 198, 0.5), -3px -3px 8px #ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.85)',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '50%',
            transition: 'all 0.15s ease',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#121622' : '#1e293b',
            color: '#fff',
            fontSize: '0.75rem',
            borderRadius: 8,
            padding: '6px 12px',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.4)',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};
