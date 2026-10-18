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
      elevation={4}
      sx={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 0.6,
        borderRadius: 3,
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
        boxShadow: isDark
          ? '0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      {tools.map((item, index) => {
        const isActive = activeTool === item.id;
        const isDisabled = isViewer && item.id !== 'selection' && item.id !== 'pan';
        return (
          <React.Fragment key={item.id}>
            {index === 2 || index === 8 || index === 10 ? (
              <Divider orientation="vertical" flexItem sx={{ my: 0.5, mx: 0.2 }} />
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
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    color: isActive ? '#fff' : isDark ? '#cbd5e1' : '#475569',
                    bgcolor: isActive ? '#6366f1' : 'transparent',
                    opacity: isDisabled ? 0.35 : 1,
                    '&:hover': {
                      bgcolor: isActive ? '#4f46e5' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    },
                    transition: 'all 0.15s ease-in-out',
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
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    pointerEvents: 'none',
                    color: isActive ? 'rgba(255,255,255,0.85)' : isDark ? '#64748b' : '#94a3b8',
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
