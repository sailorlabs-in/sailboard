import rough from 'roughjs';
import { CanvasElement, UserPresence } from '@rea/shared-types';
import { BoundingBox, getElementBounds, getResizeHandles } from './math';
import { applyFillOpacity } from '../utils/colorUtils';

function getEffectiveFill(backgroundColor?: string, fillOpacity?: number): string | undefined {
  if (!backgroundColor || backgroundColor === 'transparent' || backgroundColor === 'none') {
    return undefined;
  }
  if (fillOpacity !== undefined && fillOpacity <= 0) {
    return undefined;
  }
  if (fillOpacity !== undefined && fillOpacity < 100 && !backgroundColor.startsWith('rgba')) {
    return applyFillOpacity(backgroundColor, fillOpacity);
  }
  return backgroundColor;
}

export interface RenderOptions {
  theme: 'light' | 'dark';
  gridVisible: boolean;
  gridType?: 'dots' | 'grid' | 'blank';
  zoom: number;
  pan: { x: number; y: number };
  selectedElementIds: string[];
  selectionBox: BoundingBox | null;
  remoteUsers: UserPresence[];
  activeStyleMode: 'rough' | 'clean'; // Excalidraw vs Eraser
}

export function renderScene(
  canvas: HTMLCanvasElement,
  elements: CanvasElement[],
  options: RenderOptions
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const width = canvas.width;
  const height = canvas.height;
  const { theme, gridVisible, gridType = 'dots', zoom, pan, selectedElementIds, selectionBox, remoteUsers, activeStyleMode } = options;
  const isDark = theme === 'dark';

  // Clear canvas
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = isDark ? '#121622' : '#e2e8f0';
  ctx.fillRect(0, 0, width, height);

  // Apply High-DPI Camera Transform (DPR * Pan and Zoom)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  // Render Background Grid
  if (gridVisible && gridType !== 'blank') {
    renderGrid(ctx, width / dpr, height / dpr, zoom, pan, isDark, gridType);
  }

  // Initialize Rough.js canvas generator
  const rc = rough.canvas(canvas);

  // Render Elements in Z-Index / Order
  for (const el of elements) {
    if (el.isDeleted) continue;
    renderElement(ctx, rc, el, activeStyleMode, isDark);
  }

  // Render Selection Bounds & Handles
  if (selectedElementIds.length > 0) {
    const selectedElements = elements.filter((el) => selectedElementIds.includes(el.id) && !el.isDeleted);
    renderSelection(ctx, selectedElements, zoom, isDark);
  }

  // Render Marquee Drag Selection Box
  if (selectionBox) {
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.fillRect(selectionBox.minX, selectionBox.minY, selectionBox.width, selectionBox.height);
    ctx.strokeRect(selectionBox.minX, selectionBox.minY, selectionBox.width, selectionBox.height);
    ctx.restore();
  }

  // Render Remote Collaborators' Selections (Figma Style)
  for (const user of remoteUsers) {
    if (user.selectedElementIds && user.selectedElementIds.length > 0) {
      const userElements = elements.filter(
        (el) => !el.isDeleted && user.selectedElementIds?.includes(el.id)
      );
      if (userElements.length > 0) {
        renderRemoteSelection(ctx, userElements, user, zoom);
      }
    }
  }

  // Render Remote Collaborators' Cursors
  for (const user of remoteUsers) {
    if (user.cursor) {
      renderRemoteCursor(ctx, user, zoom);
    }
  }

  ctx.restore();
}

const generator = rough.generator();
const roughShapeCache = new Map<string, { key: string; drawable: any }>();

function renderGrid(
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  viewHeight: number,
  zoom: number,
  pan: { x: number; y: number },
  isDark: boolean,
  type: 'dots' | 'grid'
) {
  const gridSize = 24;
  const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
  const endX = startX + Math.ceil(viewWidth / zoom) + gridSize;
  const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
  const endY = startY + Math.ceil(viewHeight / zoom) + gridSize;

  ctx.save();

  if (type === 'dots') {
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.14)';
    const dotRadius = Math.max(0.75, 1.0 / zoom);
    const size = dotRadius * 2;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.rect(x - dotRadius, y - dotRadius, size, size);
      }
    }
    ctx.fill();
  } else {
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function renderElement(
  ctx: CanvasRenderingContext2D,
  rc: any,
  el: CanvasElement,
  activeStyleMode: 'rough' | 'clean',
  isDark: boolean
) {
  ctx.save();
  ctx.globalAlpha = (el.opacity ?? 100) / 100;

  // Use element's roughness unless override or clean mode selected
  const useRough = activeStyleMode === 'rough' && (el.roughness ?? 1) > 0;
  const roughOpts = {
    seed: el.seed || 1,
    stroke: el.strokeColor || (isDark ? '#e2e8f0' : '#1e293b'),
    strokeWidth: el.strokeWidth || 2,
    roughness: el.roughness ?? (useRough ? 1.2 : 0),
    fill: getEffectiveFill(el.backgroundColor, el.fillOpacity),
    fillStyle: el.fillStyle === 'none' ? undefined : el.fillStyle,
    strokeLineDash:
      el.strokeStyle === 'dashed' ? [8, 6] : el.strokeStyle === 'dotted' ? [3, 4] : undefined,
  };

  const x = el.x;
  const y = el.y;
  const w = el.width;
  const h = el.height;

  // Rotation
  if (el.angle && el.angle !== 0) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(el.angle);
    ctx.translate(-cx, -cy);
  }

  const baseKey = `${el.id}_${x}_${y}_${w}_${h}_${roughOpts.stroke}_${roughOpts.fill}_${roughOpts.fillStyle}_${roughOpts.strokeWidth}_${roughOpts.roughness}_${roughOpts.seed}_${el.strokeStyle}`;

  switch (el.type) {
    case 'rectangle': {
      if (useRough) {
        let cached = roughShapeCache.get(el.id);
        if (!cached || cached.key !== baseKey) {
          cached = {
            key: baseKey,
            drawable: generator.rectangle(x, y, w, h, roughOpts),
          };
          roughShapeCache.set(el.id, cached);
        }
        rc.draw(cached.drawable);
      } else {
        renderCleanRect(ctx, x, y, w, h, el, isDark);
      }
      renderElementText(ctx, el, isDark);
      break;
    }

    case 'diamond': {
      const top: [number, number] = [x + w / 2, y];
      const right: [number, number] = [x + w, y + h / 2];
      const bottom: [number, number] = [x + w / 2, y + h];
      const left: [number, number] = [x, y + h / 2];

      if (useRough) {
        let cached = roughShapeCache.get(el.id);
        if (!cached || cached.key !== baseKey) {
          cached = {
            key: baseKey,
            drawable: generator.polygon([top, right, bottom, left], roughOpts),
          };
          roughShapeCache.set(el.id, cached);
        }
        rc.draw(cached.drawable);
      } else {
        ctx.beginPath();
        ctx.moveTo(top[0], top[1]);
        ctx.lineTo(right[0], right[1]);
        ctx.lineTo(bottom[0], bottom[1]);
        ctx.lineTo(left[0], left[1]);
        ctx.closePath();
        applyCleanFillAndStroke(ctx, el, isDark);
      }
      renderElementText(ctx, el, isDark);
      break;
    }

    case 'ellipse': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      if (useRough) {
        let cached = roughShapeCache.get(el.id);
        if (!cached || cached.key !== baseKey) {
          cached = {
            key: baseKey,
            drawable: generator.ellipse(cx, cy, Math.abs(w), Math.abs(h), roughOpts),
          };
          roughShapeCache.set(el.id, cached);
        }
        rc.draw(cached.drawable);
      } else {
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
        applyCleanFillAndStroke(ctx, el, isDark);
      }
      renderElementText(ctx, el, isDark);
      break;
    }

    case 'sticky': {
      renderStickyNote(ctx, rc, el, useRough, isDark);
      break;
    }

    case 'line': {
      if (el.points && el.points.length >= 2) {
        if (useRough) {
          for (let i = 0; i < el.points.length - 1; i++) {
            rc.line(
              x + el.points[i].x,
              y + el.points[i].y,
              x + el.points[i + 1].x,
              y + el.points[i + 1].y,
              roughOpts
            );
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(x + el.points[0].x, y + el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(x + el.points[i].x, y + el.points[i].y);
          }
          applyCleanStroke(ctx, el, isDark);
        }
      }
      break;
    }

    case 'arrow': {
      renderArrow(ctx, rc, el, useRough, isDark);
      break;
    }

    case 'draw': {
      if (el.points && el.points.length > 0) {
        ctx.beginPath();
        const strokeColor = el.strokeColor || (isDark ? '#e2e8f0' : '#1e293b');
        const strokeWidth = el.strokeWidth || 2;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (el.points.length === 1) {
          ctx.arc(x + el.points[0].x, y + el.points[0].y, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = strokeColor;
          ctx.fill();
        } else if (el.points.length === 2) {
          ctx.moveTo(x + el.points[0].x, y + el.points[0].y);
          ctx.lineTo(x + el.points[1].x, y + el.points[1].y);
          ctx.stroke();
        } else {
          ctx.moveTo(x + el.points[0].x, y + el.points[0].y);
          for (let i = 1; i < el.points.length - 1; i++) {
            const p1 = el.points[i];
            const p2 = el.points[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.quadraticCurveTo(x + p1.x, y + p1.y, x + midX, y + midY);
          }
          const last = el.points[el.points.length - 1];
          ctx.lineTo(x + last.x, y + last.y);
          ctx.stroke();
        }
      }
      break;
    }

    case 'text': {
      renderStandaloneText(ctx, el, isDark);
      break;
    }
  }

  ctx.restore();
}

function renderCleanRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  el: CanvasElement,
  isDark: boolean
) {
  const r = 8; // rounded corners for clean modern look
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  applyCleanFillAndStroke(ctx, el, isDark);
}

function applyCleanFillAndStroke(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isDark: boolean
) {
  const fill = getEffectiveFill(el.backgroundColor, el.fillOpacity);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = el.strokeColor || (isDark ? '#e2e8f0' : '#1e293b');
  ctx.lineWidth = el.strokeWidth || 2;
  if (el.strokeStyle === 'dashed') ctx.setLineDash([8, 6]);
  else if (el.strokeStyle === 'dotted') ctx.setLineDash([3, 4]);
  else ctx.setLineDash([]);
  ctx.stroke();
}

function applyCleanStroke(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isDark: boolean
) {
  ctx.strokeStyle = el.strokeColor || (isDark ? '#e2e8f0' : '#1e293b');
  ctx.lineWidth = el.strokeWidth || 2;
  if (el.strokeStyle === 'dashed') ctx.setLineDash([8, 6]);
  else if (el.strokeStyle === 'dotted') ctx.setLineDash([3, 4]);
  else ctx.setLineDash([]);
  ctx.stroke();
}

function renderStickyNote(
  ctx: CanvasRenderingContext2D,
  rc: any,
  el: CanvasElement,
  useRough: boolean,
  isDark: boolean
) {
  const { x, y, width: w, height: h } = el;
  const foldSize = 16;
  const rawBg = el.backgroundColor || (isDark ? '#3b3218' : '#fef08a');
  const bgColor = getEffectiveFill(rawBg, el.fillOpacity) || 'transparent';
  const borderColor = el.strokeColor || (isDark ? '#eab308' : '#ca8a04');

  // Sticky body polygon with folded corner
  const p1 = [x, y];
  const p2 = [x + w - foldSize, y];
  const p3 = [x + w, y + foldSize];
  const p4 = [x + w, y + h];
  const p5 = [x, y + h];

  ctx.save();
  // Drop shadow for sticky note
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.lineTo(p3[0], p3[1]);
  ctx.lineTo(p4[0], p4[1]);
  ctx.lineTo(p5[0], p5[1]);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.restore();

  // Border & Fold flap
  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Little fold triangle
  ctx.beginPath();
  ctx.moveTo(x + w - foldSize, y);
  ctx.lineTo(x + w - foldSize, y + foldSize);
  ctx.lineTo(x + w, y + foldSize);
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Sticky Text
  if (el.text) {
    ctx.save();
    ctx.fillStyle = el.textColor || (isDark ? '#fef3c7' : '#1e293b');
    ctx.font = `500 ${el.fontSize || 14}px 'Caveat', 'Inter', cursive, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const lines = el.text.split('\n');
    const lineHeight = (el.fontSize || 14) * 1.35;
    lines.forEach((line, index) => {
      ctx.fillText(line, x + 12, y + 14 + index * lineHeight);
    });
    ctx.restore();
  }
}

function renderArrow(
  ctx: CanvasRenderingContext2D,
  rc: any,
  el: CanvasElement,
  useRough: boolean,
  isDark: boolean
) {
  const points = el.points || [
    { x: 0, y: 0 },
    { x: el.width, y: el.height },
  ];
  if (points.length < 2) return;

  const startX = el.x + points[0].x;
  const startY = el.y + points[0].y;
  const endX = el.x + points[points.length - 1].x;
  const endY = el.y + points[points.length - 1].y;

  const strokeColor = el.strokeColor || (isDark ? '#e2e8f0' : '#1e293b');
  const strokeWidth = el.strokeWidth || 2;

  // Draw arrow shaft
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(el.x + points[i].x, el.y + points[i].y);
  }
  ctx.stroke();

  // Draw Arrowhead at the end
  const angle = Math.atan2(endY - (el.y + points[points.length - 2].y), endX - (el.x + points[points.length - 2].x));
  const headLen = 14 + strokeWidth * 2;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLen * Math.cos(angle - Math.PI / 6),
    endY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLen * Math.cos(angle + Math.PI / 6),
    endY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
  ctx.restore();
}

function renderElementText(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isDark: boolean
) {
  if (!el.text) return;
  ctx.save();
  ctx.fillStyle = el.textColor || (isDark ? '#f8fafc' : '#0f172a');
  ctx.font = `600 ${el.fontSize || 14}px 'Inter', sans-serif`;
  ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'center';
  ctx.textBaseline = 'middle';

  const lines = el.text.split('\n');
  const lineHeight = (el.fontSize || 14) * 1.35;
  const totalHeight = lines.length * lineHeight;
  const startY = el.y + el.height / 2 - totalHeight / 2 + lineHeight / 2;

  const textX =
    el.textAlign === 'left'
      ? el.x + 12
      : el.textAlign === 'right'
      ? el.x + el.width - 12
      : el.x + el.width / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, startY + index * lineHeight);
  });
  ctx.restore();
}

function renderStandaloneText(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isDark: boolean
) {
  if (!el.text) return;
  ctx.save();
  ctx.fillStyle = el.textColor || el.strokeColor || (isDark ? '#f8fafc' : '#0f172a');
  ctx.font = `500 ${el.fontSize || 18}px 'Inter', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const lines = el.text.split('\n');
  const lineHeight = (el.fontSize || 18) * 1.35;
  lines.forEach((line, index) => {
    ctx.fillText(line, el.x, el.y + index * lineHeight);
  });
  ctx.restore();
}

function renderSelection(
  ctx: CanvasRenderingContext2D,
  selected: CanvasElement[],
  zoom: number,
  isDark: boolean
) {
  ctx.save();
  for (const el of selected) {
    const bounds = getElementBounds(el);
    const padding = 6 / zoom;
    const x = bounds.minX - padding;
    const y = bounds.minY - padding;
    const w = bounds.width + padding * 2;
    const h = bounds.height + padding * 2;

    // Selection border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.strokeRect(x, y, w, h);

    // 8 Resize handles
    const handles = getResizeHandles({ minX: x, minY: y, maxX: x + w, maxY: y + h, width: w, height: h }, zoom);
    ctx.setLineDash([]);
    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2 / zoom;

    const handleSize = 8 / zoom;
    for (const handle of handles) {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    }
  }
  ctx.restore();
}

function renderRemoteSelection(
  ctx: CanvasRenderingContext2D,
  selectedElements: CanvasElement[],
  user: UserPresence,
  zoom: number
) {
  ctx.save();
  const padding = 6 / zoom;
  const color = user.color || '#ec4899';

  for (const el of selectedElements) {
    const bounds = getElementBounds(el);
    const x = bounds.minX - padding;
    const y = bounds.minY - padding;
    const w = bounds.width + padding * 2;
    const h = bounds.height + padding * 2;

    // Tint background
    ctx.fillStyle = `${color}18`;
    ctx.fillRect(x, y, w, h);

    // Bounding outline
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 3 / zoom]);
    ctx.strokeRect(x, y, w, h);

    // Attached collaborator badge pinned to top-left (Figma style)
    const label = `${user.userName}${user.role === 'viewer' ? ' (viewer)' : ''}`;
    const fontSize = Math.max(9, 11 / zoom);
    ctx.font = `700 ${fontSize}px 'Inter', sans-serif`;
    const textMetrics = ctx.measureText(label);
    const badgeW = textMetrics.width + 10 / zoom;
    const badgeH = 18 / zoom;
    const badgeX = x;
    const badgeY = y - badgeH;

    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, [4 / zoom, 4 / zoom, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, badgeX + 5 / zoom, badgeY + badgeH * 0.72);
  }
  ctx.restore();
}

function renderRemoteCursor(
  ctx: CanvasRenderingContext2D,
  user: UserPresence,
  zoom: number
) {
  if (!user.cursor) return;
  const { x, y } = user.cursor;
  const color = user.color || '#3b82f6';

  ctx.save();
  ctx.translate(x, y);

  // Draw sharp Figma pointer arrow with white border
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5 / zoom;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 17 / zoom);
  ctx.lineTo(4.5 / zoom, 12.5 / zoom);
  ctx.lineTo(9.5 / zoom, 21 / zoom);
  ctx.lineTo(13 / zoom, 19.5 / zoom);
  ctx.lineTo(8 / zoom, 11 / zoom);
  ctx.lineTo(13.5 / zoom, 11 / zoom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw User Name badge
  const label = user.userName;
  const fontSize = Math.max(9, 11 / zoom);
  ctx.font = `700 ${fontSize}px 'Inter', sans-serif`;
  const textMetrics = ctx.measureText(label);
  const tagW = textMetrics.width + 12 / zoom;
  const tagH = 19 / zoom;
  const tagX = 14 / zoom;
  const tagY = 12 / zoom;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 5 / zoom);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, tagX + 6 / zoom, tagY + tagH * 0.72);

  ctx.restore();
}
