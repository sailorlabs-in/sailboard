import React, { useRef, useEffect } from 'react';
import { Paper } from '@mui/material';
import { CanvasElement } from '@rea/shared-types';
import { getElementBounds } from '../canvas/math';

interface MinimapProps {
  elements: CanvasElement[];
  zoom: number;
  pan: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
  onNavigate: (newPan: { x: number; y: number }) => void;
  theme: 'light' | 'dark';
}

export const Minimap: React.FC<MinimapProps> = ({
  elements,
  zoom,
  pan,
  containerWidth,
  containerHeight,
  onNavigate,
  theme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = theme === 'dark';
  const width = 160;
  const height = 110;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Compute bounding box of all elements with margin
    const visibleElements = elements.filter((e) => !e.isDeleted);
    let minX = -100;
    let minY = -100;
    let maxX = 1200;
    let maxY = 800;

    if (visibleElements.length > 0) {
      const bounds = visibleElements.map(getElementBounds);
      minX = Math.min(...bounds.map((b) => b.minX)) - 200;
      minY = Math.min(...bounds.map((b) => b.minY)) - 200;
      maxX = Math.max(...bounds.map((b) => b.maxX)) + 200;
      maxY = Math.max(...bounds.map((b) => b.maxY)) + 200;
    }

    const worldW = Math.max(800, maxX - minX);
    const worldH = Math.max(600, maxY - minY);
    const scale = Math.min(width / worldW, height / worldH);

    ctx.save();
    ctx.translate(10, 10);

    // Draw elements
    ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)';
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;

    for (const el of visibleElements) {
      const b = getElementBounds(el);
      const mx = (b.minX - minX) * scale;
      const my = (b.minY - minY) * scale;
      const mw = Math.max(2, b.width * scale);
      const mh = Math.max(2, b.height * scale);
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeRect(mx, my, mw, mh);
    }

    // Draw current viewport indicator
    const viewWorldX = -pan.x / zoom;
    const viewWorldY = -pan.y / zoom;
    const viewWorldW = containerWidth / zoom;
    const viewWorldH = containerHeight / zoom;

    const vmx = (viewWorldX - minX) * scale;
    const vmy = (viewWorldY - minY) * scale;
    const vmw = viewWorldW * scale;
    const vmh = viewWorldH * scale;

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(vmx, vmy, vmw, vmh);
    ctx.strokeRect(vmx, vmy, vmw, vmh);

    ctx.restore();
  }, [elements, zoom, pan, containerWidth, containerHeight, isDark]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left - 10;
    const clickY = e.clientY - rect.top - 10;

    const visibleElements = elements.filter((e) => !e.isDeleted);
    let minX = -100;
    let minY = -100;
    let maxX = 1200;
    let maxY = 800;

    if (visibleElements.length > 0) {
      const bounds = visibleElements.map(getElementBounds);
      minX = Math.min(...bounds.map((b) => b.minX)) - 200;
      minY = Math.min(...bounds.map((b) => b.minY)) - 200;
      maxX = Math.max(...bounds.map((b) => b.maxX)) + 200;
      maxY = Math.max(...bounds.map((b) => b.maxY)) + 200;
    }

    const worldW = Math.max(800, maxX - minX);
    const worldH = Math.max(600, maxY - minY);
    const scale = Math.min(width / worldW, height / worldH);

    const targetWorldX = minX + clickX / scale;
    const targetWorldY = minY + clickY / scale;

    onNavigate({
      x: containerWidth / 2 - targetWorldX * zoom,
      y: containerHeight / 2 - targetWorldY * zoom,
    });
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        width,
        height,
        borderRadius: 2,
        overflow: 'hidden',
        zIndex: 30,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        cursor: 'crosshair',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      }}
    >
      <canvas ref={canvasRef} width={width} height={height} onClick={handleClick} />
    </Paper>
  );
};
