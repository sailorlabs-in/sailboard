import { createTheme, ThemeOptions } from '@mui/material/styles';

export const getAppTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';

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
        default: isDark ? '#0b0f19' : '#f8fafc',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 14px 0 rgba(0,0,0,0.4)'
                : '0 4px 14px 0 rgba(99, 102, 241, 0.2)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#334155',
            color: '#fff',
            fontSize: '0.75rem',
            borderRadius: 6,
            padding: '6px 10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};
