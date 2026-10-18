import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Slider,
  IconButton,
  Tooltip,
  ButtonGroup,
  Button,
  Divider,
} from '@mui/material';
import {
  DeleteOutlined,
  ContentCopyOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  FormatColorFillOutlined,
  BorderColorOutlined,
  LineWeightOutlined,
  OpacityOutlined,
  AutoAwesomeOutlined,
  TextFieldsOutlined,
} from '@mui/icons-material';
import { CanvasElement, FillStyle, StrokeStyle } from '@rea/shared-types';

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  currentStyle: {
    strokeColor: string;
    backgroundColor: string;
    textColor?: string;
    fillStyle: FillStyle;
    strokeWidth: number;
    strokeStyle: StrokeStyle;
    roughness: number;
    opacity: number;
    fontSize: number;
  };
  onUpdateStyle: (updates: Partial<CanvasElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  theme: 'light' | 'dark';
}

const STROKE_COLORS = [
  '#000000',
  '#ffffff',
  '#e11d48',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0284c7',
  '#6366f1',
  '#9333ea',
  '#64748b',
];

const FILL_COLORS = [
  'transparent',
  '#ffffff',
  '#ffe4e6',
  '#ffedd5',
  '#fef9c3',
  '#dcfce7',
  '#e0f2fe',
  '#e0e7ff',
  '#f3e8ff',
  '#f1f5f9',
];

const TEXT_COLORS = [
  '#ffffff',
  '#000000',
  '#f87171',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#94a3b8',
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElements,
  currentStyle,
  onUpdateStyle,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  theme,
}) => {
  const isDark = theme === 'dark';
  const hasSelection = selectedElements.length > 0;

  // Active values (either from first selected element or default currentStyle)
  const activeStroke = hasSelection ? selectedElements[0].strokeColor : currentStyle.strokeColor;
  const activeBg = hasSelection ? selectedElements[0].backgroundColor : currentStyle.backgroundColor;
  const activeTextColor = hasSelection
    ? selectedElements[0].textColor || (isDark ? '#f8fafc' : '#0f172a')
    : currentStyle.textColor || (isDark ? '#f8fafc' : '#0f172a');
  const activeFontSize = hasSelection
    ? selectedElements[0].fontSize || currentStyle.fontSize
    : currentStyle.fontSize;
  const activeFillStyle = hasSelection ? selectedElements[0].fillStyle : currentStyle.fillStyle;
  const activeWidth = hasSelection ? selectedElements[0].strokeWidth : currentStyle.strokeWidth;
  const activeStrokeStyle = hasSelection ? selectedElements[0].strokeStyle : currentStyle.strokeStyle;
  const activeRoughness = hasSelection ? selectedElements[0].roughness : currentStyle.roughness;
  const activeOpacity = hasSelection ? selectedElements[0].opacity : currentStyle.opacity;

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'absolute',
        top: 80,
        left: 20,
        width: 220,
        zIndex: 35,
        p: 2,
        borderRadius: 3.5,
        bgcolor: isDark ? '#1a1e2d' : '#e6ecf2',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: isDark
          ? '8px 8px 24px rgba(0, 0, 0, 0.55), -5px -5px 16px rgba(255, 255, 255, 0.04)'
          : '8px 8px 24px #b8c0ca, -8px -8px 24px #ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.6,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#94a3b8' : '#64748b' }}>
          {hasSelection ? `${selectedElements.length} Selected` : 'Default Styles'}
        </Typography>
        {hasSelection && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Duplicate (Ctrl+D)">
              <IconButton size="small" onClick={onDuplicate} sx={{ p: 0.5 }}>
                <ContentCopyOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete (Del)">
              <IconButton size="small" color="error" onClick={onDelete} sx={{ p: 0.5 }}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Stroke Color */}
      <Box>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, fontWeight: 600 }}>
          <BorderColorOutlined sx={{ fontSize: 13 }} /> Stroke Color
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.6 }}>
          {STROKE_COLORS.map((color) => (
            <Box
              key={color}
              onClick={() => onUpdateStyle({ strokeColor: color })}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                bgcolor: color,
                border: activeStroke === color ? '2px solid #6366f1' : `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                cursor: 'pointer',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.15)' },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Background Fill Color */}
      <Box>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, fontWeight: 600 }}>
          <FormatColorFillOutlined sx={{ fontSize: 13 }} /> Fill Color
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.6 }}>
          {FILL_COLORS.map((color) => (
            <Box
              key={color}
              onClick={() => onUpdateStyle({ backgroundColor: color })}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                bgcolor: color === 'transparent' ? 'transparent' : color,
                border: activeBg === color ? '2px solid #6366f1' : `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.15)' },
                ...(color === 'transparent' && {
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                }),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Text Color (Supports Double-Click Text on Shapes, Text Blocks & Sticky Notes) */}
      <Box>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, fontWeight: 600 }}>
          <TextFieldsOutlined sx={{ fontSize: 13 }} /> Text Color
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.6 }}>
          {TEXT_COLORS.map((color) => (
            <Box
              key={color}
              onClick={() => onUpdateStyle({ textColor: color })}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                bgcolor: color,
                border: activeTextColor === color ? '2px solid #6366f1' : `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                cursor: 'pointer',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.15)' },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Font Size */}
      <Box>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
          Font Size
        </Typography>
        <ButtonGroup size="small" fullWidth sx={{ height: 26 }}>
          {[14, 18, 24, 32].map((fs) => (
            <Button
              key={fs}
              variant={activeFontSize === fs ? 'contained' : 'outlined'}
              onClick={() => onUpdateStyle({ fontSize: fs })}
              sx={{ fontSize: '0.65rem' }}
            >
              {fs}px
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Fill Style */}
      <Box>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
          Fill Style
        </Typography>
        <ButtonGroup size="small" fullWidth sx={{ height: 26 }}>
          {(['none', 'solid', 'hachure', 'cross-hatch'] as FillStyle[]).map((style) => (
            <Button
              key={style}
              variant={activeFillStyle === style ? 'contained' : 'outlined'}
              onClick={() => onUpdateStyle({ fillStyle: style })}
              sx={{ fontSize: '0.65rem', p: 0.2 }}
            >
              {style === 'none' ? 'None' : style === 'cross-hatch' ? 'Cross' : style}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Stroke Width */}
      <Box>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5, fontWeight: 600 }}>
          <LineWeightOutlined sx={{ fontSize: 13 }} /> Stroke Width
        </Typography>
        <ButtonGroup size="small" fullWidth sx={{ height: 26 }}>
          {[1, 2, 4, 6].map((w) => (
            <Button
              key={w}
              variant={activeWidth === w ? 'contained' : 'outlined'}
              onClick={() => onUpdateStyle({ strokeWidth: w })}
              sx={{ fontSize: '0.7rem' }}
            >
              {w}px
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Stroke Style */}
      <Box>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
          Stroke Pattern
        </Typography>
        <ButtonGroup size="small" fullWidth sx={{ height: 26 }}>
          {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map((st) => (
            <Button
              key={st}
              variant={activeStrokeStyle === st ? 'contained' : 'outlined'}
              onClick={() => onUpdateStyle({ strokeStyle: st })}
              sx={{ fontSize: '0.65rem' }}
            >
              {st}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Roughness (Excalidraw vs Eraser) */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
            <AutoAwesomeOutlined sx={{ fontSize: 13 }} /> Roughness
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem' }}>
            {activeRoughness === 0 ? 'Clean' : `${activeRoughness.toFixed(1)}x`}
          </Typography>
        </Box>
        <Slider
          size="small"
          min={0}
          max={2.5}
          step={0.1}
          value={activeRoughness}
          onChange={(_, val) => onUpdateStyle({ roughness: val as number })}
          sx={{ py: 0.5 }}
        />
      </Box>

      {/* Opacity */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
            <OpacityOutlined sx={{ fontSize: 13 }} /> Opacity
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem' }}>
            {activeOpacity}%
          </Typography>
        </Box>
        <Slider
          size="small"
          min={10}
          max={100}
          step={5}
          value={activeOpacity}
          onChange={(_, val) => onUpdateStyle({ opacity: val as number })}
          sx={{ py: 0.5 }}
        />
      </Box>

      {/* Z-Index Controls */}
      {hasSelection && (
        <>
          <Divider sx={{ my: 0.2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Tooltip title="Bring to Front">
              <Button size="small" variant="outlined" startIcon={<VerticalAlignTopOutlined />} onClick={onBringToFront} sx={{ fontSize: '0.65rem', py: 0.4 }}>
                Front
              </Button>
            </Tooltip>
            <Tooltip title="Send to Back">
              <Button size="small" variant="outlined" startIcon={<VerticalAlignBottomOutlined />} onClick={onSendToBack} sx={{ fontSize: '0.65rem', py: 0.4 }}>
                Back
              </Button>
            </Tooltip>
          </Box>
        </>
      )}
    </Paper>
  );
};
