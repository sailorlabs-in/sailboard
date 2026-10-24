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
  ChevronRightOutlined,
  LockOutlined,
  LockOpenOutlined,
  FormatAlignLeftOutlined,
  FormatAlignCenterOutlined,
  FormatAlignRightOutlined,
  ColorLensOutlined,
  CropSquareOutlined,
  RoundedCornerOutlined,
  ArrowForwardOutlined,
  FlipOutlined,
  AlignHorizontalLeftOutlined,
  AlignHorizontalCenterOutlined,
  AlignHorizontalRightOutlined,
  AlignVerticalTopOutlined,
  AlignVerticalCenterOutlined,
  AlignVerticalBottomOutlined,
  AddOutlined,
  RemoveOutlined,
} from '@mui/icons-material';
import { CanvasElement, ElementType, FillStyle, StrokeStyle, ArrowHead, TextAlign } from '@rea/shared-types';
import {
  parseColor,
  applyFillOpacity,
  isColorMatchingSwatch,
} from '../utils/colorUtils';
import { animateTactileClick } from '../utils/animations';
import { NeuSegmentedControl } from './NeuSegmentedControl';

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
    fontFamily?: string;
    textAlign?: TextAlign;
    fillOpacity?: number;
    roundness?: 'sharp' | 'round' | null;
    startArrowhead?: ArrowHead | null;
    endArrowhead?: ArrowHead | null;
  };
  onUpdateStyle: (updates: Partial<CanvasElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  theme: 'light' | 'dark';
  activeTool?: ElementType | 'eraser' | 'pan' | 'comment';
  onLockToggle?: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onAlign?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute?: (direction: 'horizontal' | 'vertical') => void;
}

const STROKE_COLORS = [
  'contrast',
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
  'contrast',
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
  'contrast',
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

function PropertiesPanelComponent({
  selectedElements,
  currentStyle,
  onUpdateStyle,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  theme,
  activeTool,
  onLockToggle,
  onFlipHorizontal,
  onFlipVertical,
  onAlign,
  onDistribute,
}: PropertiesPanelProps) {
  const isDark = theme === 'dark';
  const hasSelection = selectedElements.length > 0;
  const muiTheme = useTheme();
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [isCollapsed, setIsCollapsed] = useState(isTablet);
  const [isExiting, setIsExiting] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const isAnimatingRef = useRef(false);

  // Sync default collapse state when breakpoint changes
  useEffect(() => {
    setIsCollapsed(isTablet);
  }, [isTablet]);

  // Entrance animation when opening the Styles panel (slides in from right)
  useEffect(() => {
    if (!isCollapsed && panelRef.current) {
      gsap.killTweensOf(panelRef.current);
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, x: 28, scale: 0.94, filter: 'blur(4px)' },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.35,
          ease: 'power3.out',
          clearProps: 'transform,filter',
          onComplete: () => {
            isAnimatingRef.current = false;
            window.dispatchEvent(new Event('resize'));
          },
        }
      );

      const children = panelRef.current.children;
      if (children && children.length > 0) {
        gsap.fromTo(
          Array.from(children),
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            stagger: 0.02,
            ease: 'power2.out',
            delay: 0.05,
            clearProps: 'opacity,transform',
          }
        );
      }
    }
  }, [isCollapsed]);

  // Entrance animation for the collapsed "Styles" pill (from right)
  useEffect(() => {
    if (isCollapsed && pillRef.current) {
      gsap.killTweensOf(pillRef.current);
      gsap.fromTo(
        pillRef.current,
        { opacity: 0, scale: 0.78, x: 16 },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          duration: 0.35,
          ease: 'back.out(1.8)',
          clearProps: 'transform',
          onComplete: () => {
            isAnimatingRef.current = false;
          },
        }
      );
    }
  }, [isCollapsed]);

  const handleOpen = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    if (pillRef.current) {
      gsap.to(pillRef.current, {
        opacity: 0,
        scale: 0.82,
        x: 12,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => {
          setIsCollapsed(false);
        },
      });
    } else {
      setIsCollapsed(false);
    }
  };

  const handleClose = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsExiting(true);

    if (panelRef.current) {
      const children = panelRef.current.children;
      if (children && children.length > 0) {
        gsap.to(Array.from(children), {
          opacity: 0,
          y: -4,
          duration: 0.14,
          stagger: 0.012,
          ease: 'power2.in',
        });
      }

      gsap.to(panelRef.current, {
        opacity: 0,
        x: 28,
        scale: 0.94,
        filter: 'blur(4px)',
        duration: 0.22,
        ease: 'power3.in',
        onComplete: () => {
          setIsExiting(false);
          setIsCollapsed(true);
        },
      });
    } else {
      setIsExiting(false);
      setIsCollapsed(true);
      isAnimatingRef.current = false;
    }
  };

  // Active values (either from first selected element or default currentStyle)
  const activeStroke = hasSelection ? selectedElements[0].strokeColor : currentStyle.strokeColor;
  const activeBg = hasSelection ? selectedElements[0].backgroundColor : currentStyle.backgroundColor;
  const parsedBg = parseColor(activeBg);
  const activeFillOpacity = hasSelection
    ? (selectedElements[0].fillOpacity ?? parsedBg.opacityPercent)
    : (currentStyle.fillOpacity ?? parsedBg.opacityPercent);

  // Remember last non-transparent fill color to revive it when adjusting opacity from 0%
  const lastNonTransparentBgRef = useRef<string>(
    !parsedBg.isTransparent && parsedBg.baseHex !== 'transparent'
      ? parsedBg.baseHex
      : '#6366f1'
  );

  useEffect(() => {
    if (!parsedBg.isTransparent && parsedBg.baseHex !== 'transparent') {
      lastNonTransparentBgRef.current = parsedBg.baseHex;
    }
  }, [parsedBg]);

  const handleSelectFillColor = (color: string) => {
    if (color === 'transparent') {
      if (!parsedBg.isTransparent && parsedBg.baseHex !== 'transparent' && parsedBg.baseHex !== 'contrast') {
        lastNonTransparentBgRef.current = parsedBg.baseHex;
      }
      onUpdateStyle({ backgroundColor: 'transparent', fillOpacity: 0 });
      return;
    }

    if (color === 'contrast') {
      lastNonTransparentBgRef.current = 'contrast';
      const targetOpacity = activeFillOpacity <= 0 ? 15 : activeFillOpacity;
      onUpdateStyle({ backgroundColor: 'contrast', fillOpacity: targetOpacity });
      return;
    }

    lastNonTransparentBgRef.current = color;
    const targetOpacity = activeFillOpacity <= 0 ? 100 : activeFillOpacity;
    const newBg = applyFillOpacity(color, targetOpacity);
    onUpdateStyle({ backgroundColor: newBg, fillOpacity: targetOpacity });
  };

  const handleFillOpacityChange = (newOpacity: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(newOpacity)));
    if (clamped === 0) {
      if (!parsedBg.isTransparent && parsedBg.baseHex !== 'transparent') {
        lastNonTransparentBgRef.current = parsedBg.baseHex;
      }
      onUpdateStyle({ backgroundColor: 'transparent', fillOpacity: 0 });
      return;
    }

    const baseColor =
      !parsedBg.isTransparent && parsedBg.baseHex !== 'transparent'
        ? parsedBg.baseHex
        : (lastNonTransparentBgRef.current || '#6366f1');

    if (baseColor === 'contrast') {
      onUpdateStyle({ backgroundColor: 'contrast', fillOpacity: clamped });
      return;
    }

    const newBg = applyFillOpacity(baseColor, clamped);
    onUpdateStyle({ backgroundColor: newBg, fillOpacity: clamped });
  };
  const activeTextColor = hasSelection
    ? selectedElements[0].textColor || 'contrast'
    : currentStyle.textColor || 'contrast';
  const activeFontSize = hasSelection
    ? selectedElements[0].fontSize || currentStyle.fontSize
    : currentStyle.fontSize;
  const activeFontFamily = hasSelection
    ? selectedElements[0].fontFamily || currentStyle.fontFamily || 'hand-drawn'
    : currentStyle.fontFamily || 'hand-drawn';
  const activeTextAlign = hasSelection
    ? selectedElements[0].textAlign || currentStyle.textAlign || 'center'
    : currentStyle.textAlign || 'center';
  const activeRoundness = hasSelection
    ? selectedElements[0].roundness || currentStyle.roundness || 'sharp'
    : currentStyle.roundness || 'sharp';
  const activeStartArrowhead = hasSelection
    ? selectedElements[0].startArrowhead || currentStyle.startArrowhead || 'none'
    : currentStyle.startArrowhead || 'none';
  const activeEndArrowhead = hasSelection
    ? selectedElements[0].endArrowhead || currentStyle.endArrowhead || 'arrow'
    : currentStyle.endArrowhead || 'arrow';
  const isLocked = hasSelection && selectedElements.every((el) => el.locked);

  const activeFillStyle = hasSelection ? selectedElements[0].fillStyle : currentStyle.fillStyle;
  const activeWidth = hasSelection ? selectedElements[0].strokeWidth : currentStyle.strokeWidth;
  const activeStrokeStyle = hasSelection ? selectedElements[0].strokeStyle : currentStyle.strokeStyle;
  const activeRoughness = hasSelection ? selectedElements[0].roughness : currentStyle.roughness;
  const activeOpacity = hasSelection ? selectedElements[0].opacity : currentStyle.opacity;

  // Contextual visibility flags
  const showStroke = !hasSelection
    ? activeTool !== 'text' && activeTool !== 'sticky' && activeTool !== 'frame'
    : selectedElements.some((el) => el.type !== 'text' && el.type !== 'sticky' && el.type !== 'image' && el.type !== 'frame');

  const showFill = !hasSelection
    ? activeTool !== 'line' && activeTool !== 'arrow' && activeTool !== 'draw' && activeTool !== 'text' && activeTool !== 'frame'
    : selectedElements.some((el) => el.type !== 'line' && el.type !== 'arrow' && el.type !== 'draw' && el.type !== 'text' && el.type !== 'image' && el.type !== 'frame');

  const showFillStyle = !hasSelection
    ? activeTool !== 'line' && activeTool !== 'arrow' && activeTool !== 'draw' && activeTool !== 'text' && activeTool !== 'sticky' && activeTool !== 'frame'
    : selectedElements.some((el) => !['line', 'arrow', 'draw', 'text', 'sticky', 'image', 'frame'].includes(el.type));

  const showRoundness = hasSelection
    ? selectedElements.some((el) => el.type === 'rectangle' || el.type === 'diamond')
    : activeTool === 'rectangle' || activeTool === 'diamond';

  const showArrowheads = hasSelection
    ? selectedElements.some((el) => el.type === 'arrow' || el.type === 'line')
    : activeTool === 'arrow' || activeTool === 'line';

  const canHaveText = (type: string) =>
    ['text', 'sticky', 'rectangle', 'diamond', 'ellipse'].includes(type);

  const showText = !hasSelection
    ? activeTool === 'text' || activeTool === 'sticky' || activeTool === 'rectangle' || activeTool === 'diamond' || activeTool === 'ellipse'
    : selectedElements.some((el) => canHaveText(el.type) || Boolean(el.text));

  const showRoughness = !hasSelection
    ? activeTool !== 'text' && activeTool !== 'sticky' && activeTool !== 'frame'
    : selectedElements.some((el) => el.type !== 'text' && el.type !== 'image' && el.type !== 'frame');

  const showAlign = selectedElements.length >= 2;

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
    mode: 'stroke' | 'fill' | 'text' = 'stroke'
  ) => {
    const isFill = mode === 'fill';
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
        {colors.map((color) => {
          const isSelected = isColorMatchingSwatch(activeVal, color, isFill);
          const isContrast = color === 'contrast';
          const isTransparent = isFill && color === 'transparent';

          let tooltipTitle = color;
          if (isContrast) {
            tooltipTitle =
              mode === 'text'
                ? 'Contrast Text (Auto dark/light depending on outer shape & theme)'
                : mode === 'fill'
                ? 'Contrast Fill (Auto dark/light depending on theme)'
                : 'Contrast Stroke (Auto dark/light depending on theme)';
          } else if (isTransparent) {
            tooltipTitle = 'Transparent / None';
          }

          return (
            <Tooltip key={color} title={tooltipTitle} placement="top" arrow>
              <Box
                onClick={() => onSelect(color)}
                sx={{
                  position: 'relative',
                  width: 22,
                  height: 22,
                  borderRadius: '6px',
                  bgcolor: isContrast || isTransparent ? 'transparent' : color,
                  border: isSelected
                    ? '2px solid var(--neu-primary-light)'
                    : isContrast
                    ? '1.5px solid rgba(148, 163, 184, 0.4)'
                    : 'var(--neu-border)',
                  boxShadow: isSelected ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-btn)',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  justifySelf: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'scale(1.18)',
                    zIndex: 2,
                    boxShadow: 'var(--neu-shadow-btn-hover)',
                  },
                  ...(isContrast && {
                    background: 'linear-gradient(135deg, #0f172a 50%, #f8fafc 50%)',
                  }),
                  ...(isTransparent && {
                    backgroundImage:
                      'linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)',
                    backgroundSize: '6px 6px',
                    backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                  }),
                }}
              >
                {/* Visual marker inside contrast swatch */}
                {isContrast && (
                  <Box
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      bgcolor: isSelected ? 'var(--neu-primary-light)' : 'rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 0 4px rgba(0,0,0,0.4)',
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}
        {/* Custom Hex Color Picker Swatch */}
        <Tooltip title="Custom Color (Hex Picker)" placement="top" arrow>
          <Box
            component="label"
            sx={{
              position: 'relative',
              width: 22,
              height: 22,
              borderRadius: '6px',
              border: 'var(--neu-border)',
              boxShadow: 'var(--neu-shadow-btn)',
              cursor: 'pointer',
              justifySelf: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              bgcolor: 'var(--neu-surface)',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.18)',
                zIndex: 2,
                boxShadow: 'var(--neu-shadow-btn-hover)',
              },
            }}
          >
            <ColorLensOutlined sx={{ fontSize: 13, color: 'var(--neu-primary-light)' }} />
            <input
              type="color"
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
              value={activeVal.startsWith('#') ? activeVal : '#6366f1'}
              onChange={(e) => onSelect(e.target.value)}
            />
          </Box>
        </Tooltip>
      </Box>
    );
  };

  if (isCollapsed && !isExiting) {
    return (
      <Tooltip title="Open Style Inspector" placement="left">
        <Paper
          ref={pillRef}
          elevation={0}
          className="neu-floating"
          onClick={handleOpen}
          sx={{
            position: 'absolute',
            top: { xs: 68, sm: 80 },
            right: { xs: 12, sm: 20 },
            left: 'auto',
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
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: 'var(--neu-surface-hover)',
              transform: 'translateX(-2px) scale(1.03)',
              boxShadow: 'var(--neu-shadow-btn-hover)',
              '& .tune-icon': {
                transform: 'rotate(45deg)',
              },
            },
          }}
        >
          <TuneOutlined className="tune-icon" sx={{ fontSize: 18, color: 'var(--neu-primary-light)', transition: 'transform 0.3s ease' }} />
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
        right: { xs: 12, sm: 20 },
        left: 'auto',
        width: { xs: 236, sm: 252 },
        maxHeight: { xs: '76vh', sm: '78vh' },
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--neu-scrollbar, rgba(120, 140, 180, 0.3)) transparent',
        '&::-webkit-scrollbar': {
          width: '5px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--neu-scrollbar, rgba(120, 140, 180, 0.3))',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'var(--neu-scrollbar-hover, rgba(120, 140, 180, 0.5))',
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
          <Tooltip title="Collapse Style Panel">
            <IconButton
              size="small"
              onClick={handleClose}
              className="neu-icon-btn"
              sx={{
                width: 22,
                height: 22,
                p: 0.2,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1) translateX(2px)',
                },
              }}
            >
              <ChevronRightOutlined sx={{ fontSize: 15 }} />
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
            {onLockToggle && (
              <Tooltip title={isLocked ? 'Unlock (Ctrl+Shift+L)' : 'Lock (Ctrl+Shift+L)'}>
                <IconButton
                  size="small"
                  onClick={onLockToggle}
                  className="neu-icon-btn"
                  sx={{
                    width: 24,
                    height: 24,
                    color: isLocked ? 'var(--neu-primary-light)' : 'inherit',
                  }}
                >
                  {isLocked ? <LockOutlined sx={{ fontSize: 13 }} /> : <LockOpenOutlined sx={{ fontSize: 13 }} />}
                </IconButton>
              </Tooltip>
            )}
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

      {/* Frame Name */}
      {hasSelection && selectedElements.length === 1 && selectedElements[0].type === 'frame' && (
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
            Frame Name
          </Typography>
          <Box
            component="input"
            type="text"
            value={selectedElements[0].frameLabel || selectedElements[0].text || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateStyle({ frameLabel: e.target.value, text: e.target.value })
            }
            placeholder="Frame title..."
            sx={{
              width: '100%',
              boxSizing: 'border-box',
              px: 1,
              py: 0.6,
              borderRadius: '8px',
              border: 'var(--neu-border)',
              bgcolor: 'var(--neu-surface)',
              color: 'var(--neu-text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              fontWeight: 600,
              outline: 'none',
              boxShadow: 'var(--neu-shadow-pressed)',
              transition: 'border-color 0.15s ease',
              '&:focus': {
                borderColor: 'var(--neu-primary-light)',
              },
            }}
          />
        </Box>
      )}

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
          {renderColorGrid(STROKE_COLORS, activeStroke, (c) => onUpdateStyle({ strokeColor: c }), 'stroke')}
        </Box>
      )}

      {/* Background Fill Color & Fill Opacity */}
      {showFill && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
            {renderColorGrid(FILL_COLORS, activeBg, handleSelectFillColor, 'fill')}
          </Box>

          {/* Fill Opacity Slider & Quick Presets */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
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
                <OpacityOutlined sx={{ fontSize: 12 }} /> Fill Opacity
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.65rem' }}>
                {activeFillOpacity}%
              </Typography>
            </Box>
            <Slider
              size="small"
              min={0}
              max={100}
              step={5}
              value={activeFillOpacity}
              onChange={(_, val) => handleFillOpacityChange(val as number)}
              sx={{
                py: 0.2,
                color: 'var(--neu-primary)',
                '& .MuiSlider-thumb': { width: 12, height: 12 },
                '& .MuiSlider-track': { height: 3 },
                '& .MuiSlider-rail': { height: 3 },
              }}
            />
            <NeuSegmentedControl
              size="small"
              value={String(activeFillOpacity)}
              onChange={(val) => handleFillOpacityChange(Number(val))}
              sx={{ width: '100%', mt: 0.2 }}
              ariaLabel="Fill Opacity"
              options={[0, 25, 50, 75, 100].map((pct) => ({
                value: String(pct),
                label: `${pct}%`,
              }))}
            />
          </Box>
        </Box>
      )}

      {/* Text Inside Shape Editor */}
      {showText && hasSelection && (
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
            <TextFieldsOutlined sx={{ fontSize: 12 }} /> Text Inside Shape
          </Typography>
          <Box
            component="textarea"
            rows={2}
            value={selectedElements[0].text || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onUpdateStyle({ text: e.target.value })
            }
            placeholder="Type text inside shape..."
            sx={{
              width: '100%',
              boxSizing: 'border-box',
              p: 0.8,
              borderRadius: '8px',
              border: 'var(--neu-border)',
              bgcolor: 'var(--neu-surface)',
              color: 'var(--neu-text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              resize: 'vertical',
              outline: 'none',
              boxShadow: 'var(--neu-shadow-pressed)',
              transition: 'border-color 0.15s ease',
              '&:focus': {
                borderColor: 'var(--neu-primary-light)',
              },
            }}
          />
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
          {renderColorGrid(TEXT_COLORS, activeTextColor, (c) => onUpdateStyle({ textColor: c }), 'text')}
        </Box>
      )}

      {/* Font Size with Stepper Number Selector and Wide Presets */}
      {showText && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
            >
              Font Size
            </Typography>
            {/* Number Selector / Stepper */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.3,
                bgcolor: 'var(--neu-surface)',
                border: 'var(--neu-border)',
                borderRadius: '8px',
                p: '2px 4px',
                boxShadow: 'var(--neu-shadow-pressed)',
              }}
            >
              <IconButton
                size="small"
                onClick={() => onUpdateStyle({ fontSize: Math.max(8, (activeFontSize || 16) - 2) })}
                sx={{ width: 18, height: 18, p: 0, color: 'var(--neu-text-secondary)' }}
              >
                <RemoveOutlined sx={{ fontSize: 11 }} />
              </IconButton>
              <Box
                component="input"
                type="number"
                min={8}
                max={120}
                value={activeFontSize || 16}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    onUpdateStyle({ fontSize: Math.max(8, Math.min(160, val)) });
                  }
                }}
                sx={{
                  width: 36,
                  border: 'none',
                  bgcolor: 'transparent',
                  color: 'var(--neu-text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                  p: 0,
                  MozAppearance: 'textfield',
                  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'var(--neu-text-secondary)', mr: 0.2 }}>
                px
              </Typography>
              <IconButton
                size="small"
                onClick={() => onUpdateStyle({ fontSize: Math.min(160, (activeFontSize || 16) + 2) })}
                sx={{ width: 18, height: 18, p: 0, color: 'var(--neu-text-secondary)' }}
              >
                <AddOutlined sx={{ fontSize: 11 }} />
              </IconButton>
            </Box>
          </Box>
          <NeuSegmentedControl
            size="small"
            value={String(activeFontSize)}
            onChange={(fs) => onUpdateStyle({ fontSize: Number(fs) })}
            sx={{ width: '100%' }}
            ariaLabel="Font Size"
            options={[12, 16, 24, 32, 48, 64].map((fs) => ({
              value: String(fs),
              label: `${fs}`,
            }))}
          />
        </Box>
      )}

      {/* Font Family */}
      {showText && (
        <Box>
          <Typography
            variant="caption"
            sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
          >
            Font Family
          </Typography>
          <NeuSegmentedControl
            size="small"
            value={activeFontFamily}
            onChange={(ff) => onUpdateStyle({ fontFamily: ff })}
            sx={{ width: '100%' }}
            ariaLabel="Font Family"
            options={[
              { value: 'hand-drawn', label: 'Virgil' },
              { value: 'sans-serif', label: 'Normal' },
              { value: 'monospace', label: 'Code' },
            ]}
          />
        </Box>
      )}

      {/* Text Alignment */}
      {showText && (
        <Box>
          <Typography
            variant="caption"
            sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
          >
            Text Align
          </Typography>
          <NeuSegmentedControl
            size="small"
            value={activeTextAlign}
            onChange={(al) => onUpdateStyle({ textAlign: al as TextAlign })}
            sx={{ width: '100%' }}
            ariaLabel="Text Align"
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </Box>
      )}

      {/* Edges / Roundness */}
      {showRoundness && (
        <Box>
          <Typography
            variant="caption"
            sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
          >
            Edges
          </Typography>
          <NeuSegmentedControl
            size="small"
            value={activeRoundness || 'sharp'}
            onChange={(r) => onUpdateStyle({ roundness: r as 'sharp' | 'round' })}
            sx={{ width: '100%' }}
            ariaLabel="Edges"
            options={[
              { value: 'sharp', label: 'Sharp' },
              { value: 'round', label: 'Round' },
            ]}
          />
        </Box>
      )}

      {/* Arrowheads */}
      {showArrowheads && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
            >
              Start Arrowhead
            </Typography>
            <NeuSegmentedControl
              size="small"
              value={activeStartArrowhead || 'none'}
              onChange={(ah) => onUpdateStyle({ startArrowhead: ah as ArrowHead })}
              sx={{ width: '100%' }}
              ariaLabel="Start Arrowhead"
              options={[
                { value: 'none', label: 'None' },
                { value: 'arrow', label: 'Arrow' },
                { value: 'triangle', label: 'Triangle' },
                { value: 'circle', label: 'Dot' },
                { value: 'bar', label: 'Bar' },
              ]}
            />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
            >
              End Arrowhead
            </Typography>
            <NeuSegmentedControl
              size="small"
              value={activeEndArrowhead || 'arrow'}
              onChange={(ah) => onUpdateStyle({ endArrowhead: ah as ArrowHead })}
              sx={{ width: '100%' }}
              ariaLabel="End Arrowhead"
              options={[
                { value: 'none', label: 'None' },
                { value: 'arrow', label: 'Arrow' },
                { value: 'triangle', label: 'Triangle' },
                { value: 'circle', label: 'Dot' },
                { value: 'bar', label: 'Bar' },
              ]}
            />
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
          <NeuSegmentedControl
            size="small"
            value={activeFillStyle}
            onChange={(style) => onUpdateStyle({ fillStyle: style as FillStyle })}
            sx={{ width: '100%' }}
            ariaLabel="Fill Style"
            options={[
              { value: 'none', label: 'None' },
              { value: 'solid', label: 'Solid' },
              { value: 'hachure', label: 'Hachure' },
              { value: 'cross-hatch', label: 'Cross' },
            ]}
          />
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
          <NeuSegmentedControl
            size="small"
            value={String(activeWidth)}
            onChange={(w) => onUpdateStyle({ strokeWidth: Number(w) })}
            sx={{ width: '100%' }}
            ariaLabel="Stroke Width"
            options={[1, 2, 4, 6].map((w) => ({
              value: String(w),
              label: `${w}px`,
            }))}
          />
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
          <NeuSegmentedControl
            size="small"
            value={activeStrokeStyle}
            onChange={(st) => onUpdateStyle({ strokeStyle: st as StrokeStyle })}
            sx={{ width: '100%' }}
            ariaLabel="Stroke Pattern"
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
            ]}
          />
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

      {/* Layer Opacity */}
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
            <OpacityOutlined sx={{ fontSize: 12 }} /> Layer Opacity
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

          {/* Transform / Flip */}
          {(onFlipHorizontal || onFlipVertical) && (
            <Box sx={{ display: 'flex', gap: 0.8, mt: 0.2 }}>
              {onFlipHorizontal && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onFlipHorizontal}
                  className="neu-btn"
                  sx={{ fontSize: '0.62rem', py: 0.3, px: 0.6, flex: 1 }}
                >
                  Flip H
                </Button>
              )}
              {onFlipVertical && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onFlipVertical}
                  className="neu-btn"
                  sx={{ fontSize: '0.62rem', py: 0.3, px: 0.6, flex: 1 }}
                >
                  Flip V
                </Button>
              )}
            </Box>
          )}

          {/* Align & Distribute */}
          {showAlign && onAlign && (
            <Box sx={{ mt: 0.2 }}>
              <Typography
                variant="caption"
                sx={{ mb: 0.4, display: 'block', fontWeight: 600, fontSize: '0.68rem', color: 'var(--neu-text-primary)' }}
              >
                Align & Distribute
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                <Tooltip title="Align Left">
                  <IconButton size="small" onClick={() => onAlign('left')} className="neu-icon-btn" sx={{ width: 26, height: 26 }}>
                    <AlignHorizontalLeftOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Align Center">
                  <IconButton size="small" onClick={() => onAlign('center')} className="neu-icon-btn" sx={{ width: 26, height: 26 }}>
                    <AlignHorizontalCenterOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Align Right">
                  <IconButton size="small" onClick={() => onAlign('right')} className="neu-icon-btn" sx={{ width: 26, height: 26 }}>
                    <AlignHorizontalRightOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Align Top">
                  <IconButton size="small" onClick={() => onAlign('top')} className="neu-icon-btn" sx={{ width: 26, height: 26 }}>
                    <AlignVerticalTopOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Align Middle">
                  <IconButton size="small" onClick={() => onAlign('middle')} className="neu-icon-btn" sx={{ width: 26, height: 26 }}>
                    <AlignVerticalCenterOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Align Bottom">
                  <IconButton size="small" onClick={() => onAlign('bottom')} className="neu-icon-btn" sx={{ width: 26, height: 26 }}>
                    <AlignVerticalBottomOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              {onDistribute && (
                <Box sx={{ display: 'flex', gap: 0.8, mt: 0.6 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onDistribute('horizontal')}
                    className="neu-btn"
                    sx={{ fontSize: '0.62rem', py: 0.2, px: 0.5, flex: 1 }}
                  >
                    Distribute H
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onDistribute('vertical')}
                    className="neu-btn"
                    sx={{ fontSize: '0.62rem', py: 0.2, px: 0.5, flex: 1 }}
                  >
                    Distribute V
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}

export const PropertiesPanel = React.memo(PropertiesPanelComponent);
