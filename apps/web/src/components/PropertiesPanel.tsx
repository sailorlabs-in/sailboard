import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  Paper,
  Box,
  Typography,
  Slider,
  IconButton,
  Tooltip,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
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
  TuneOutlined,
  ChevronLeftOutlined,
} from '@mui/icons-material';
import { CanvasElement, ElementType, FillStyle, StrokeStyle } from '@rea/shared-types';

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
  activeTool?: ElementType | 'eraser' | 'pan';
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
  activeTool,
}) => {
  const isDark = theme === 'dark';
  const hasSelection = selectedElements.length > 0;
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isCollapsed && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, x: -16, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [isCollapsed]);

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

  // Contextual visibility flags
  const showStroke = !hasSelection
    ? activeTool !== 'text' && activeTool !== 'sticky'
    : selectedElements.some((el) => el.type !== 'text' && el.type !== 'sticky' && el.type !== 'image');

  const showFill = !hasSelection
    ? activeTool !== 'line' && activeTool !== 'arrow' && activeTool !== 'draw' && activeTool !== 'text'
    : selectedElements.some((el) => el.type !== 'line' && el.type !== 'arrow' && el.type !== 'draw' && el.type !== 'text' && el.type !== 'image');

  const showFillStyle = !hasSelection
    ? activeTool !== 'line' && activeTool !== 'arrow' && activeTool !== 'draw' && activeTool !== 'text' && activeTool !== 'sticky'
    : selectedElements.some((el) => !['line', 'arrow', 'draw', 'text', 'sticky', 'image'].includes(el.type));

  const showText = !hasSelection
    ? activeTool === 'text' || activeTool === 'sticky'
    : selectedElements.some((el) => el.type === 'text' || el.type === 'sticky');

  const showRoughness = !hasSelection
    ? activeTool !== 'text' && activeTool !== 'sticky'
    : selectedElements.some((el) => el.type !== 'text' && el.type !== 'image');

  // Title formatting
  const headerTitle = hasSelection
    ? selectedElements.length === 1
      ? (selectedElements[0].type === 'sticky'
          ? 'Sticky Note'
          : selectedElements[0].type.charAt(0).toUpperCase() + selectedElements[0].type.slice(1))
      : `${selectedElements.length} Selected`
    : activeTool && activeTool !== 'selection'
    ? `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Style`
    : 'Default Styles';

  const renderColorGrid = (
    colors: string[],
    activeVal: string,
    onSelect: (color: string) => void,
    isFill = false
  ) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
      {colors.map((color) => {
        const isSelected = activeVal === color;
        return (
          <Box
            key={color}
            onClick={() => onSelect(color)}
            sx={{
              width: 22,
              height: 22,
              borderRadius: '6px',
              bgcolor: color === 'transparent' ? 'transparent' : color,
              border: isSelected ? '2px solid var(--neu-primary-light)' : 'var(--neu-border)',
              boxShadow: isSelected ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-btn)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              justifySelf: 'center',
              '&:hover': { transform: 'scale(1.15)' },
              ...(isFill &&
                color === 'transparent' && {
                  backgroundImage:
                    'linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }),
            }}
          />
        );
      })}
    </Box>
  );

  if (isCollapsed) {
    return (
      <Tooltip title="Open Style Inspector" placement="right">
        <Paper
          elevation={0}
          className="neu-floating"
          onClick={() => setIsCollapsed(false)}
          sx={{
            position: 'absolute',
            top: { xs: 68, sm: 80 },
            left: { xs: 12, sm: 20 },
            zIndex: 35,
            px: 1.4,
            py: 0.8,
            borderRadius: '12px',
            bgcolor: 'var(--neu-surface)',
            border: 'var(--neu-border)',
            boxShadow: 'var(--neu-shadow-floating)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'var(--neu-surface-hover)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--neu-shadow-btn-hover)',
            },
          }}
        >
          <TuneOutlined sx={{ fontSize: 18, color: 'var(--neu-primary-light)' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--neu-text-primary)' }}>
            Styles
          </Typography>
        </Paper>
      </Tooltip>
    );
  }

  return (
    <Paper
      ref={panelRef}
      elevation={0}
      className="neu-floating"
      sx={{
        position: 'absolute',
        top: { xs: 68, sm: 80 },
        left: { xs: 12, sm: 20 },
        width: { xs: 200, sm: 218 },
        maxHeight: { xs: 'calc(100vh - 90px)', sm: 'calc(100vh - 110px)' },
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE and Edge
        '&::-webkit-scrollbar': {
          display: 'none', // Chrome, Safari, Opera
          width: 0,
          height: 0,
        },
        zIndex: 35,
        p: 1.2,
        borderRadius: '16px',
        bgcolor: 'var(--neu-surface)',
        border: 'var(--neu-border)',
        boxShadow: 'var(--neu-shadow-floating)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.0,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
          <Tooltip title="Collapse Styles Inspector">
            <IconButton
              size="small"
              onClick={() => setIsCollapsed(true)}
              className="neu-icon-btn"
              sx={{ width: 22, height: 22, p: 0.2 }}
            >
              <ChevronLeftOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.68rem',
              color: 'var(--neu-text-secondary)',
            }}
          >
            {headerTitle}
          </Typography>
        </Box>
        {hasSelection && (
          <Box sx={{ display: 'flex', gap: 0.4 }}>
            <Tooltip title="Duplicate (Ctrl+D)">
              <IconButton size="small" onClick={onDuplicate} className="neu-icon-btn" sx={{ width: 24, height: 24 }}>
                <ContentCopyOutlined sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete (Del)">
              <IconButton size="small" color="error" onClick={onDelete} className="neu-icon-btn" sx={{ width: 24, height: 24 }}>
                <DeleteOutlined sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Stroke Color */}
      {showStroke && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.4,
              fontWeight: 600,
              fontSize: '0.68rem',
              color: 'var(--neu-text-primary)',
            }}
          >
            <BorderColorOutlined sx={{ fontSize: 12 }} /> Stroke Color
          </Typography>
          {renderColorGrid(STROKE_COLORS, activeStroke, (c) => onUpdateStyle({ strokeColor: c }))}
        </Box>
      )}

      {/* Background Fill Color */}
      {showFill && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.4,
              fontWeight: 600,
              fontSize: '0.68rem',
              color: 'var(--neu-text-primary)',
            }}
          >
            <FormatColorFillOutlined sx={{ fontSize: 12 }} /> Fill Color
          </Typography>
          {renderColorGrid(FILL_COLORS, activeBg, (c) => onUpdateStyle({ backgroundColor: c }), true)}
        </Box>
      )}

      {/* Text Color */}
      {showText && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.4,
              fontWeight: 600,
              fontSize: '0.68rem',
              color: 'var(--neu-text-primary)',
            }}
          >
            <TextFieldsOutlined sx={{ fontSize: 12 }} /> Text Color
          </Typography>
          {renderColorGrid(TEXT_COLORS, activeTextColor, (c) => onUpdateStyle({ textColor: c }))}
        </Box>
      )}

      {/* Font Size */}
      {showText && (
        <Box>
          <Typography
            variant="caption"
            sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
          >
            Font Size
          </Typography>
          <Box className="neu-segmented" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 0.25 }}>
            {[14, 18, 24, 32].map((fs) => (
              <button
                key={fs}
                type="button"
                className={`neu-segmented-item ${activeFontSize === fs ? 'active' : ''}`}
                onClick={() => onUpdateStyle({ fontSize: fs })}
                style={{ flex: 1, padding: '3px 1px', fontSize: '0.65rem', textAlign: 'center' }}
              >
                {fs}px
              </button>
            ))}
          </Box>
        </Box>
      )}

      {/* Fill Style */}
      {showFillStyle && (
        <Box>
          <Typography
            variant="caption"
            sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
          >
            Fill Style
          </Typography>
          <Box className="neu-segmented" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 0.25 }}>
            {(['none', 'solid', 'hachure', 'cross-hatch'] as FillStyle[]).map((style) => (
              <button
                key={style}
                type="button"
                className={`neu-segmented-item ${activeFillStyle === style ? 'active' : ''}`}
                onClick={() => onUpdateStyle({ fillStyle: style })}
                style={{ flex: 1, padding: '3px 1px', fontSize: '0.62rem', textAlign: 'center' }}
              >
                {style === 'none' ? 'None' : style === 'cross-hatch' ? 'Cross' : style}
              </button>
            ))}
          </Box>
        </Box>
      )}

      {/* Stroke Width */}
      {showStroke && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.4,
              fontWeight: 600,
              fontSize: '0.68rem',
              color: 'var(--neu-text-primary)',
            }}
          >
            <LineWeightOutlined sx={{ fontSize: 12 }} /> Stroke Width
          </Typography>
          <Box className="neu-segmented" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 0.25 }}>
            {[1, 2, 4, 6].map((w) => (
              <button
                key={w}
                type="button"
                className={`neu-segmented-item ${activeWidth === w ? 'active' : ''}`}
                onClick={() => onUpdateStyle({ strokeWidth: w })}
                style={{ flex: 1, padding: '3px 1px', fontSize: '0.65rem', textAlign: 'center' }}
              >
                {w}px
              </button>
            ))}
          </Box>
        </Box>
      )}

      {/* Stroke Style */}
      {showStroke && (
        <Box>
          <Typography
            variant="caption"
            sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
          >
            Stroke Pattern
          </Typography>
          <Box className="neu-segmented" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 0.25 }}>
            {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                className={`neu-segmented-item ${activeStrokeStyle === st ? 'active' : ''}`}
                onClick={() => onUpdateStyle({ strokeStyle: st })}
                style={{ flex: 1, padding: '3px 1px', fontSize: '0.62rem', textAlign: 'center' }}
              >
                {st}
              </button>
            ))}
          </Box>
        </Box>
      )}

      {/* Roughness */}
      {showRoughness && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.4,
                fontWeight: 600,
                fontSize: '0.68rem',
                color: 'var(--neu-text-primary)',
              }}
            >
              <AutoAwesomeOutlined sx={{ fontSize: 12 }} /> Roughness
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.65rem' }}>
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
            sx={{
              py: 0.2,
              color: 'var(--neu-primary)',
              '& .MuiSlider-thumb': { width: 12, height: 12 },
              '& .MuiSlider-track': { height: 3 },
              '& .MuiSlider-rail': { height: 3 },
            }}
          />
        </Box>
      )}

      {/* Opacity */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              fontWeight: 600,
              fontSize: '0.68rem',
              color: 'var(--neu-text-primary)',
            }}
          >
            <OpacityOutlined sx={{ fontSize: 12 }} /> Opacity
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.65rem' }}>
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
          sx={{
            py: 0.2,
            color: 'var(--neu-primary)',
            '& .MuiSlider-thumb': { width: 12, height: 12 },
            '& .MuiSlider-track': { height: 3 },
            '& .MuiSlider-rail': { height: 3 },
          }}
        />
      </Box>

      {/* Z-Index Controls */}
      {hasSelection && (
        <>
          <Divider sx={{ my: 0.1, borderColor: 'var(--neu-border-subtle)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.8 }}>
            <Tooltip title="Bring to Front">
              <Button
                size="small"
                variant="outlined"
                startIcon={<VerticalAlignTopOutlined sx={{ fontSize: '13px !important' }} />}
                onClick={onBringToFront}
                className="neu-btn"
                sx={{ fontSize: '0.62rem', py: 0.3, px: 0.6, flex: 1 }}
              >
                Front
              </Button>
            </Tooltip>
            <Tooltip title="Send to Back">
              <Button
                size="small"
                variant="outlined"
                startIcon={<VerticalAlignBottomOutlined sx={{ fontSize: '13px !important' }} />}
                onClick={onSendToBack}
                className="neu-btn"
                sx={{ fontSize: '0.62rem', py: 0.3, px: 0.6, flex: 1 }}
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
