import React from 'react';
import { Paper, IconButton, Tooltip, Divider, Box } from '@mui/material';
import {
  NearMeOutlined,
  CropSquareOutlined,
  ChangeHistoryOutlined,
  RadioButtonUncheckedOutlined,
  TrendingFlatOutlined,
  HorizontalRuleOutlined,
  CreateOutlined,
  TextFieldsOutlined,
  StickyNote2Outlined,
  AutoFixHighOutlined,
  PanToolOutlined,
} from '@mui/icons-material';
import { ElementType } from '@rea/shared-types';

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

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect, theme, isViewer }) => {
  const isDark = theme === 'dark';

  const tools: ToolItem[] = [
    { id: 'selection', label: 'Select / Move', shortcut: 'V', icon: <NearMeOutlined fontSize="small" /> },
    { id: 'pan', label: 'Hand / Pan Canvas', shortcut: 'H', icon: <PanToolOutlined fontSize="small" /> },
    { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <CropSquareOutlined fontSize="small" /> },
    { id: 'diamond', label: 'Diamond / Decision', shortcut: 'D', icon: <ChangeHistoryOutlined fontSize="small" sx={{ transform: 'rotate(45deg)' }} /> },
    { id: 'ellipse', label: 'Ellipse / Circle', shortcut: 'O', icon: <RadioButtonUncheckedOutlined fontSize="small" /> },
    { id: 'arrow', label: 'Arrow Connector', shortcut: 'A', icon: <TrendingFlatOutlined fontSize="small" /> },
    { id: 'line', label: 'Straight Line', shortcut: 'L', icon: <HorizontalRuleOutlined fontSize="small" /> },
    { id: 'draw', label: 'Freehand Pen', shortcut: 'P', icon: <CreateOutlined fontSize="small" /> },
    { id: 'text', label: 'Text Block', shortcut: 'T', icon: <TextFieldsOutlined fontSize="small" /> },
    { id: 'sticky', label: 'Sticky Note', shortcut: 'S', icon: <StickyNote2Outlined fontSize="small" /> },
    { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: <AutoFixHighOutlined fontSize="small" /> },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 0.8,
        p: 0.8,
        borderRadius: 3.5,
        maxWidth: 'calc(100vw - 32px)',
        overflowX: 'auto',
        bgcolor: isDark ? '#1a1e2d' : '#e6ecf2',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: isDark
          ? '8px 8px 24px rgba(0, 0, 0, 0.55), -5px -5px 16px rgba(255, 255, 255, 0.04)'
          : '8px 8px 24px #b8c0ca, -8px -8px 24px #ffffff',
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
                  mx: 0.4,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
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
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  size="small"
                  disabled={isDisabled}
                  onClick={() => onToolSelect(item.id)}
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    color: isActive ? (isDark ? '#818cf8' : '#4f46e5') : isDark ? '#94a3b8' : '#475569',
                    bgcolor: isActive
                      ? isDark
                        ? '#141724'
                        : '#d8dfe8'
                      : isDark
                      ? '#1c2030'
                      : '#e6ecf2',
                    boxShadow: isActive
                      ? isDark
                        ? 'inset 3px 3px 6px rgba(0,0,0,0.65), inset -2px -2px 4px rgba(255,255,255,0.05), 0 0 12px rgba(99,102,241,0.35)'
                        : 'inset 3px 3px 6px #b4bcc6, inset -3px -3px 6px #ffffff, 0 0 12px rgba(79,70,229,0.3)'
                      : isDark
                      ? '3px 3px 7px rgba(0,0,0,0.45), -2px -2px 6px rgba(255,255,255,0.03)'
                      : '3px 3px 7px #c2c9d1, -3px -3px 7px #ffffff',
                    border: isActive
                      ? '1px solid rgba(99, 102, 241, 0.4)'
                      : isDark
                      ? '1px solid rgba(255,255,255,0.04)'
                      : '1px solid rgba(255,255,255,0.6)',
                    opacity: isDisabled ? 0.35 : 1,
                    '&:hover': {
                      bgcolor: isActive
                        ? isDark
                          ? '#141724'
                          : '#d8dfe8'
                        : isDark
                        ? '#22273a'
                        : '#e2e8ef',
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
                    color: isActive ? '#818cf8' : isDark ? '#64748b' : '#94a3b8',
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
