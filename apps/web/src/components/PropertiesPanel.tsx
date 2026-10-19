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
      className="neu-floating"
      sx={{
        position: 'absolute',
        top: 80,
        left: 20,
        width: 236,
        zIndex: 35,
        p: 2,
        borderRadius: '16px',
        bgcolor: 'var(--neu-surface)',
        border: 'var(--neu-border)',
        boxShadow: 'var(--neu-shadow-floating)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.6,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--neu-text-secondary)' }}>
          {hasSelection ? `${selectedElements.length} Selected` : 'Default Styles'}
        </Typography>
        {hasSelection && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Duplicate (Ctrl+D)">
              <IconButton size="small" onClick={onDuplicate} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
                <ContentCopyOutlined sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete (Del)">
              <IconButton size="small" color="error" onClick={onDelete} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
                <DeleteOutlined sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Stroke Color */}
      <Box>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, fontWeight: 600, color: 'var(--neu-text-primary)' }}>
          <BorderColorOutlined sx={{ fontSize: 13 }} /> Stroke Color
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.6 }}>
          {STROKE_COLORS.map((color) => {
            const isSelected = activeStroke === color;
            return (
              <Box
                key={color}
                onClick={() => onUpdateStyle({ strokeColor: color })}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: color,
                  border: isSelected ? '2px solid var(--neu-primary-light)' : 'var(--neu-border)',
                  boxShadow: isSelected ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-btn)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { transform: 'scale(1.12)' },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Background Fill Color */}
      <Box>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, fontWeight: 600, color: 'var(--neu-text-primary)' }}>
          <FormatColorFillOutlined sx={{ fontSize: 13 }} /> Fill Color
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.6 }}>
          {FILL_COLORS.map((color) => {
            const isSelected = activeBg === color;
            return (
              <Box
                key={color}
                onClick={() => onUpdateStyle({ backgroundColor: color })}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: color === 'transparent' ? 'transparent' : color,
                  border: isSelected ? '2px solid var(--neu-primary-light)' : 'var(--neu-border)',
                  boxShadow: isSelected ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-btn)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  '&:hover': { transform: 'scale(1.12)' },
                  ...(color === 'transparent' && {
                    backgroundImage:
                      'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  }),
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Text Color */}
      <Box>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, fontWeight: 600, color: 'var(--neu-text-primary)' }}>
          <TextFieldsOutlined sx={{ fontSize: 13 }} /> Text Color
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.6 }}>
          {TEXT_COLORS.map((color) => {
            const isSelected = activeTextColor === color;
            return (
              <Box
                key={color}
                onClick={() => onUpdateStyle({ textColor: color })}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: color,
                  border: isSelected ? '2px solid var(--neu-primary-light)' : 'var(--neu-border)',
                  boxShadow: isSelected ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-btn)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { transform: 'scale(1.12)' },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Font Size */}
      <Box>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600, color: 'var(--neu-text-primary)' }}>
          Font Size
        </Typography>
        <Box className="neu-segmented" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 0.3 }}>
          {[14, 18, 24, 32].map((fs) => (
            <button
              key={fs}
              type="button"
              className={`neu-segmented-item ${activeFontSize === fs ? 'active' : ''}`}
              onClick={() => onUpdateStyle({ fontSize: fs })}
              style={{ flex: 1, padding: '4px 2px', fontSize: '0.68rem', textAlign: 'center' }}
            >
              {fs}px
            </button>
          ))}
        </Box>
      </Box>

      {/* Fill Style */}
      <Box>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600, color: 'var(--neu-text-primary)' }}>
          Fill Style
        </Typography>
        <Box className="neu-segmented" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 0.3 }}>
          {(['none', 'solid', 'hachure', 'cross-hatch'] as FillStyle[]).map((style) => (
            <button
              key={style}
              type="button"
              className={`neu-segmented-item ${activeFillStyle === style ? 'active' : ''}`}
              onClick={() => onUpdateStyle({ fillStyle: style })}
              style={{ flex: 1, padding: '4px 2px', fontSize: '0.65rem', textAlign: 'center' }}
            >
              {style === 'none' ? 'None' : style === 'cross-hatch' ? 'Cross' : style}
            </button>
          ))}
        </Box>
      </Box>

      {/* Stroke Width */}
      <Box>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5, fontWeight: 600, color: 'var(--neu-text-primary)' }}>
          <LineWeightOutlined sx={{ fontSize: 13 }} /> Stroke Width
        </Typography>
        <Box className="neu-segmented" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 0.3 }}>
          {[1, 2, 4, 6].map((w) => (
            <button
              key={w}
              type="button"
              className={`neu-segmented-item ${activeWidth === w ? 'active' : ''}`}
              onClick={() => onUpdateStyle({ strokeWidth: w })}
              style={{ flex: 1, padding: '4px 2px', fontSize: '0.68rem', textAlign: 'center' }}
            >
              {w}px
            </button>
          ))}
        </Box>
      </Box>

      {/* Stroke Style */}
      <Box>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600, color: 'var(--neu-text-primary)' }}>
          Stroke Pattern
        </Typography>
        <Box className="neu-segmented" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 0.3 }}>
          {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map((st) => (
            <button
              key={st}
              type="button"
              className={`neu-segmented-item ${activeStrokeStyle === st ? 'active' : ''}`}
              onClick={() => onUpdateStyle({ strokeStyle: st })}
              style={{ flex: 1, padding: '4px 2px', fontSize: '0.65rem', textAlign: 'center' }}
            >
              {st}
            </button>
          ))}
        </Box>
      </Box>

      {/* Roughness (Excalidraw vs Eraser) */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: 'var(--neu-text-primary)' }}>
            <AutoAwesomeOutlined sx={{ fontSize: 13 }} /> Roughness
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.7rem' }}>
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
          sx={{ py: 0.5, color: 'var(--neu-primary)' }}
        />
      </Box>

      {/* Opacity */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: 'var(--neu-text-primary)' }}>
            <OpacityOutlined sx={{ fontSize: 13 }} /> Opacity
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.7rem' }}>
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
          sx={{ py: 0.5, color: 'var(--neu-primary)' }}
        />
      </Box>

      {/* Z-Index Controls */}
      {hasSelection && (
        <>
          <Divider sx={{ my: 0.2, borderColor: 'var(--neu-border-subtle)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Tooltip title="Bring to Front">
              <Button
                size="small"
                variant="outlined"
                startIcon={<VerticalAlignTopOutlined />}
                onClick={onBringToFront}
                className="neu-btn"
                sx={{ fontSize: '0.65rem', py: 0.4, flex: 1 }}
              >
                Front
              </Button>
            </Tooltip>
            <Tooltip title="Send to Back">
              <Button
                size="small"
                variant="outlined"
                startIcon={<VerticalAlignBottomOutlined />}
                onClick={onSendToBack}
                className="neu-btn"
                sx={{ fontSize: '0.65rem', py: 0.4, flex: 1 }}
              >
                Back
              </Button>
            </Tooltip>
          </Box>
        </>
      )}
    </Paper>
  );
};
