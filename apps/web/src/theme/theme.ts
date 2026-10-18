import { createTheme, ThemeOptions } from '@mui/material/styles';

export const getNeumorphicStyles = (isDark: boolean) => ({
  flat: {
    bgcolor: isDark ? '#1a1e2d' : '#e6ecf2',
    boxShadow: isDark
      ? '5px 5px 12px rgba(0, 0, 0, 0.5), -4px -4px 10px rgba(255, 255, 255, 0.04)'
      : '5px 5px 12px #c2c9d1, -5px -5px 12px #ffffff',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(255, 255, 255, 0.7)',
  },
  inset: {
    bgcolor: isDark ? '#141722' : '#dbe2ec',
    boxShadow: isDark
      ? 'inset 3px 3px 6px rgba(0, 0, 0, 0.55), inset -2px -2px 5px rgba(255, 255, 255, 0.04)'
      : 'inset 3px 3px 6px #c2c9d1, inset -3px -3px 6px #ffffff',
    border: isDark ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(255, 255, 255, 0.5)',
  },
  active: {
    bgcolor: isDark ? '#21263c' : '#d4dce7',
    boxShadow: isDark
      ? 'inset 3px 3px 6px rgba(0, 0, 0, 0.65), inset -2px -2px 4px rgba(255, 255, 255, 0.06), 0 0 14px rgba(99, 102, 241, 0.35)'
      : 'inset 3px 3px 6px #b8c0ca, inset -3px -3px 6px #ffffff, 0 0 14px rgba(99, 102, 241, 0.35)',
    color: '#818cf8',
  },
  dock: {
    bgcolor: isDark ? 'rgba(26, 30, 45, 0.94)' : 'rgba(230, 236, 242, 0.94)',
    backdropFilter: 'blur(16px)',
    boxShadow: isDark
      ? '8px 8px 24px rgba(0, 0, 0, 0.55), -5px -5px 16px rgba(255, 255, 255, 0.04)'
      : '8px 8px 24px #b4bcc6, -8px -8px 24px #ffffff',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(255, 255, 255, 0.8)',
  },
  button: {
    bgcolor: isDark ? '#1c2030' : '#e6ecf2',
    boxShadow: isDark
      ? '4px 4px 10px rgba(0, 0, 0, 0.45), -3px -3px 8px rgba(255, 255, 255, 0.04)'
      : '4px 4px 10px #c2c9d1, -4px -4px 10px #ffffff',
    transition: 'all 0.15s ease',
    '&:hover': {
      boxShadow: isDark
        ? '2px 2px 6px rgba(0, 0, 0, 0.5), -2px -2px 5px rgba(255, 255, 255, 0.05)'
        : '2px 2px 6px #c2c9d1, -2px -2px 5px #ffffff',
    },
    '&:active': {
      boxShadow: isDark
        ? 'inset 2px 2px 5px rgba(0, 0, 0, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.04)'
        : 'inset 2px 2px 5px #c2c9d1, inset -2px -2px 5px #ffffff',
    },
  },
});

export const getAppTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  const neu = getNeumorphicStyles(isDark);

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isDark ? '#6366f1' : '#4f46e5',
        light: '#818cf8',
        dark: '#3730a3',
      },
      secondary: {
        main: '#ec4899',
      },
      background: {
        default: isDark ? '#141722' : '#dbe2ec',
        paper: isDark ? '#1a1e2d' : '#e6ecf2',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
    },
    typography: {
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
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
              : '4px 4px 12px #b8c0ca, -4px -4px 12px #ffffff, 0 4px 12px rgba(79, 70, 229, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              boxShadow: '0 6px 16px rgba(99, 102, 241, 0.45)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#161925' : '#334155',
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
