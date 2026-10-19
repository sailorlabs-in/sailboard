import React, { useEffect, useRef } from 'react';
import { Paper, IconButton, Tooltip, Divider, Box } from '@mui/material';
import { ElementType } from '@rea/shared-types';
import { animateDockIn, animateTactileClick } from '../utils/animations';

interface ToolbarProps {
  activeTool: ElementType | 'eraser' | 'pan';
  onToolSelect: (tool: ElementType | 'eraser' | 'pan') => void;
  theme: 'light' | 'dark';
  isViewer?: boolean;
}

interface ToolItem {
  id: ElementType | 'eraser' | 'pan';
  label: string;
  shortcut: string;
  icon: React.ReactNode;
}

// Pixel-perfect, modern vector icons for whiteboard tools
const CursorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    <path d="m13 13 6 6" />
  </svg>
);

const HandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const RectangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3.5" />
  </svg>
);

const DiamondIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" />
  </svg>
);

const EllipseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const LineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);

const PenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const StickyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
    <path d="M15 3v6h6" />
  </svg>
);

const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect, isViewer }) => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  // Floating dock entrance with back.out spring physics
  useEffect(() => {
    if (toolbarRef.current) {
      animateDockIn(toolbarRef.current, { delay: 0.05, duration: 0.65 });
    }
  }, []);

  const tools: ToolItem[] = [
    { id: 'selection', label: 'Select / Move', shortcut: 'V', icon: <CursorIcon /> },
    { id: 'pan', label: 'Hand / Pan Canvas', shortcut: 'H', icon: <HandIcon /> },
    { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <RectangleIcon /> },
    { id: 'diamond', label: 'Diamond / Decision', shortcut: 'D', icon: <DiamondIcon /> },
    { id: 'ellipse', label: 'Ellipse / Circle', shortcut: 'O', icon: <EllipseIcon /> },
    { id: 'arrow', label: 'Arrow Connector', shortcut: 'A', icon: <ArrowIcon /> },
    { id: 'line', label: 'Straight Line', shortcut: 'L', icon: <LineIcon /> },
    { id: 'draw', label: 'Freehand Pen', shortcut: 'P', icon: <PenIcon /> },
    { id: 'text', label: 'Text Block', shortcut: 'T', icon: <TextIcon /> },
    { id: 'sticky', label: 'Sticky Note', shortcut: 'S', icon: <StickyIcon /> },
    { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: <EraserIcon /> },
  ];

  return (
    <Paper
      ref={toolbarRef}
      elevation={0}
      className="neu-dock"
      sx={{
        position: 'absolute',
        top: { xs: 10, sm: 16 },
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 0.4, sm: 0.8 },
        p: { xs: 0.5, sm: 0.8 },
        borderRadius: '16px',
        maxWidth: 'calc(100% - 24px)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {tools.map((item, index) => {
        const isActive = activeTool === item.id;
        const isDisabled = isViewer && item.id !== 'selection' && item.id !== 'pan';
        return (
          <React.Fragment key={item.id}>
            {index === 2 || index === 8 || index === 10 ? (
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  my: 0.8,
                  mx: { xs: 0.2, sm: 0.4 },
                  borderColor: 'var(--neu-border-subtle)',
                  flexShrink: 0,
                }}
              />
            ) : null}
            <Tooltip
              title={
                isDisabled
                  ? `${item.label} (Disabled for Viewers)`
                  : `${item.label} (${item.shortcut})`
              }
              arrow
              placement="bottom"
            >
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <IconButton
                  size="small"
                  disabled={isDisabled}
                  onClick={(e) => {
                    animateTactileClick(e.currentTarget);
                    onToolSelect(item.id);
                  }}
                  sx={{
                    width: { xs: 34, sm: 38 },
                    height: { xs: 34, sm: 38 },
                    borderRadius: '10px',
                    color: isActive ? 'var(--neu-primary-light)' : 'var(--neu-text-secondary)',
                    bgcolor: isActive ? 'var(--neu-bg)' : 'var(--neu-surface)',
                    boxShadow: isActive ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-btn)',
                    border: isActive ? 'var(--neu-border-inset)' : 'var(--neu-border)',
                    opacity: isDisabled ? 0.35 : 1,
                    '&:hover': {
                      bgcolor: isActive ? 'var(--neu-bg)' : 'var(--neu-surface-hover)',
                      boxShadow: isActive ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-btn-hover)',
                      color: isActive ? 'var(--neu-primary-light)' : 'var(--neu-text-primary)',
                      transform: isDisabled ? 'none' : 'translateY(-1px)',
                    },
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {item.icon}
                </IconButton>
                {/* Shortcut Key Label */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 4,
                    fontSize: '0.52rem',
                    fontWeight: 700,
                    pointerEvents: 'none',
                    display: { xs: 'none', sm: 'block' },
                    color: isActive ? 'var(--neu-primary-light)' : 'var(--neu-text-muted)',
                  }}
                >
                  {item.shortcut}
                </Box>
              </Box>
            </Tooltip>
          </React.Fragment>
        );
      })}
    </Paper>
  );
};
