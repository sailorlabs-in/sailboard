import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  ImageOutlined,
  DataObjectOutlined,
  CodeOutlined,
  ContentCopyOutlined,
  DownloadOutlined,
} from '@mui/icons-material';
import { CanvasElement, WhiteboardDocument } from '@rea/shared-types';
import { getGroupBounds } from '../canvas/math';
import { renderScene } from '../canvas/renderer';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  document: WhiteboardDocument;
  theme: 'light' | 'dark';
  styleMode: 'rough' | 'clean';
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  document: doc,
  theme,
  styleMode,
}) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'json'>('png');
  const [transparentBg, setTransparentBg] = useState(false);
  const [scale, setScale] = useState<number>(2); // 2x default for crisp retina export

  const isDark = theme === 'dark';

  const generateExportCanvas = (): HTMLCanvasElement | null => {
    const visible = doc.elements.filter((e) => !e.isDeleted);
    if (visible.length === 0) return null;

    const bounds = getGroupBounds(visible);
    if (!bounds) return null;

    const padding = 40;
    const exportWidth = (bounds.width + padding * 2) * scale;
    const exportHeight = (bounds.height + padding * 2) * scale;

    const offscreen = document.createElement('canvas');
    offscreen.width = exportWidth;
    offscreen.height = exportHeight;

    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    if (!transparentBg) {
      ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
      ctx.fillRect(0, 0, exportWidth, exportHeight);
    }

    renderScene(offscreen, doc.elements, {
      theme,
      gridVisible: false,
      gridType: 'blank',
      zoom: scale,
      pan: {
        x: (-bounds.minX + padding) * scale,
        y: (-bounds.minY + padding) * scale,
      },
      selectedElementIds: [],
      selectionBox: null,
      remoteUsers: [],
      activeStyleMode: styleMode,
    });

    return offscreen;
  };

  const handleDownload = () => {
    if (exportFormat === 'png') {
      const canvas = generateExportCanvas();
      if (!canvas) return;

      const link = window.document.createElement('a');
      link.download = `${doc.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (exportFormat === 'svg') {
      // Export basic SVG representation
      const visible = doc.elements.filter((e) => !e.isDeleted);
      const bounds = getGroupBounds(visible) || { minX: 0, minY: 0, width: 800, height: 600 };
      const padding = 20;

      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}" width="${bounds.width + padding * 2}" height="${bounds.height + padding * 2}">\n`;
      if (!transparentBg) {
        svgContent += `  <rect x="${bounds.minX - padding}" y="${bounds.minY - padding}" width="${bounds.width + padding * 2}" height="${bounds.height + padding * 2}" fill="${isDark ? '#0b0f19' : '#ffffff'}" />\n`;
      }

      for (const el of visible) {
        if (el.type === 'rectangle') {
          svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.backgroundColor !== 'transparent' ? el.backgroundColor : 'none'}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" rx="8" />\n`;
        } else if (el.type === 'ellipse') {
          svgContent += `  <ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.backgroundColor !== 'transparent' ? el.backgroundColor : 'none'}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" />\n`;
        } else if (el.type === 'line' || el.type === 'arrow') {
          if (el.points && el.points.length >= 2) {
            const d = el.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${el.x + p.x} ${el.y + p.y}`).join(' ');
            svgContent += `  <path d="${d}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" fill="none" />\n`;
          }
        }
      }
      svgContent += `</svg>`;

      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.download = `${doc.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'json') {
      const exportData = {
        type: 'excalidraw',
        version: 2,
        source: 'eraser-excalidraw-clone',
        document: doc,
        elements: doc.elements.filter((e) => !e.isDeleted),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.download = `${doc.title.toLowerCase().replace(/\s+/g, '-')}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }

    onClose();
  };

  const handleCopyToClipboard = async () => {
    const canvas = generateExportCanvas();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        alert('Diagram copied to clipboard as PNG image!');
        onClose();
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: isDark ? '#1e293b' : '#ffffff',
            borderRadius: 3,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Export Diagram</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Choose export format and rendering options.
        </Typography>

        {/* Format Selector */}
        <RadioGroup value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}>
          <FormControlLabel
            value="png"
            control={<Radio size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImageOutlined fontSize="small" sx={{ color: '#6366f1' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>PNG Image (High Resolution)</Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="svg"
            control={<Radio size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CodeOutlined fontSize="small" sx={{ color: '#ec4899' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>SVG Vector File</Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="json"
            control={<Radio size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DataObjectOutlined fontSize="small" sx={{ color: '#10b981' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>JSON (Excalidraw & Eraser Backup)</Typography>
              </Box>
            }
          />
        </RadioGroup>

        <Divider />

        {/* Options */}
        {exportFormat === 'png' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Transparent Background</Typography>}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Resolution Scale</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[1, 2, 3].map((s) => (
                  <Button
                    key={s}
                    size="small"
                    variant={scale === s ? 'contained' : 'outlined'}
                    onClick={() => setScale(s)}
                    sx={{ minWidth: 36, px: 1, py: 0.2, fontSize: '0.75rem' }}
                  >
                    {s}x
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
        {exportFormat === 'png' ? (
          <Button startIcon={<ContentCopyOutlined />} onClick={handleCopyToClipboard} size="small">
            Copy PNG
          </Button>
        ) : <Box />}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} size="small">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadOutlined />}
            onClick={handleDownload}
            size="small"
          >
            Download
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
