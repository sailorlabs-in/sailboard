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
                  onClick={() => onToolSelect(item.id)}
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
