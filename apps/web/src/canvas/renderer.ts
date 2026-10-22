import rough from 'roughjs';
import { CanvasElement, UserPresence } from '@rea/shared-types';
import { BoundingBox, getElementBounds, getResizeHandles, ShapeAnchor } from './math';
import {
  getEffectiveStrokeColor,
  getEffectiveBackgroundColor,
  getEffectiveTextColor,
} from '../utils/colorUtils';

export interface RenderOptions {
  theme: 'light' | 'dark';
  gridVisible: boolean;
  gridType?: 'dots' | 'grid' | 'blank';
  zoom: number;
  pan: { x: number; y: number };
  selectedElementIds: string[];
  selectionBox: BoundingBox | null;
  remoteUsers: UserPresence[];
  activeStyleMode: 'rough' | 'clean'; // Sketchy hand-drawn vs Clean geometry
  activeSnapAnchor?: ShapeAnchor | null;
  candidateAnchors?: ShapeAnchor[];
  isThumbnail?: boolean;
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

  // Apply DPR transform for Screen-Space elements (Background & Grid)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const viewWidth = width / dpr;
  const viewHeight = height / dpr;

  // Render Background Grid in Screen Space (Fast, strictly bounded O(1) loop)
  if (gridVisible && gridType !== 'blank') {
    renderGrid(ctx, viewWidth, viewHeight, zoom, pan, isDark, gridType);
  }

  // Apply High-DPI Camera Transform for World Elements (DPR * Pan and Zoom)
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  // Figma Performance Optimization: Frustum / Viewport Culling
  // Compute visible world bounds plus margin and skip all off-screen elements
  const cullMargin = Math.max(120, 80 / zoom);
  const vMinX = -pan.x / zoom - cullMargin;
  const vMinY = -pan.y / zoom - cullMargin;
  const vMaxX = (width / dpr - pan.x) / zoom + cullMargin;
  const vMaxY = (height / dpr - pan.y) / zoom + cullMargin;

  // Cached Rough.js canvas instance (avoid allocating new instance per frame)
  const rc = getRoughCanvas(canvas);

  // Render Elements in Z-Index / Order (Skipping offscreen elements)
  for (const el of elements) {
    if (el.isDeleted) continue;

    // Viewport bounds check
    const bounds = getElementBounds(el);
    if (
      bounds.maxX < vMinX ||
      bounds.minX > vMaxX ||
      bounds.maxY < vMinY ||
      bounds.minY > vMaxY
    ) {
      continue; // Offscreen! Skip rough path calculation and canvas drawing
    }

    renderElement(ctx, rc, el, activeStyleMode, isDark, elements, options.isThumbnail, zoom);
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

  // Render Remote Collaborators' Selections
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

  // Render Connector Shape Anchors (Snapping Dots)
  const candidateList = [...(options.candidateAnchors || [])];
  if (
    options.activeSnapAnchor &&
    !candidateList.some(
      (a) =>
        a.elementId === options.activeSnapAnchor?.elementId &&
        a.position === options.activeSnapAnchor?.position
    )
  ) {
    candidateList.push(options.activeSnapAnchor);
  }

  if (candidateList.length > 0) {
    renderShapeAnchors(ctx, candidateList, options.activeSnapAnchor, zoom, isDark);
  }

  ctx.restore();
}

function renderShapeAnchors(
  ctx: CanvasRenderingContext2D,
  anchors: ShapeAnchor[],
  activeAnchor: ShapeAnchor | null | undefined,
  zoom: number,
  isDark: boolean
) {
  ctx.save();
  for (const anchor of anchors) {
    const isActive =
      activeAnchor &&
      activeAnchor.elementId === anchor.elementId &&
      activeAnchor.position === anchor.position;

    const radius = (isActive ? 7 : 5) / zoom;

    if (isActive) {
      // Outer aura ring
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, radius + 4 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.fill();

      // Middle glowing ring
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.lineWidth = 2 / zoom;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 2.5 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      // Normal anchor candidate
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#334155' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeStyle = '#6366f1';
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 2 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
    }
  }
  ctx.restore();
}

const generator = rough.generator();
const roughShapeCache = new Map<string, { key: string; drawable: any }>();
const roughCanvasMap = new WeakMap<HTMLCanvasElement, any>();

function getRoughCanvas(canvas: HTMLCanvasElement) {
  let rc = roughCanvasMap.get(canvas);
  if (!rc) {
    rc = rough.canvas(canvas);
    roughCanvasMap.set(canvas, rc);
  }
  return rc;
}

function renderGrid(
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  viewHeight: number,
  zoom: number,
  pan: { x: number; y: number },
  isDark: boolean,
  type: 'dots' | 'grid'
) {
  // Screen-space grid step based on base 24px grid
  let step = 24 * zoom;
  // Adaptive Level of Detail (LOD): keep on-screen spacing between 18px and 48px
  while (step < 18) {
    step *= 2;
  }

  // Screen-space start offsets matching world coordinates
  const startX = ((pan.x % step) + step) % step;
  const startY = ((pan.y % step) + step) % step;

  ctx.save();

  if (type === 'dots') {
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.15)';
    const dotSize = 1.8;
    const half = dotSize / 2;
    ctx.beginPath();
    for (let x = startX; x < viewWidth; x += step) {
      for (let y = startY; y < viewHeight; y += step) {
        ctx.rect(x - half, y - half, dotSize, dotSize);
      }
    }
    ctx.fill();
  } else {
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < viewWidth; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewHeight);
    }
    for (let y = startY; y < viewHeight; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(viewWidth, y);
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
  isDark: boolean,
  allElements?: CanvasElement[],
  isThumbnail?: boolean,
  zoom: number = 1
) {
  ctx.save();
  ctx.globalAlpha = (el.opacity ?? 100) / 100;

  const effectiveStroke = getEffectiveStrokeColor(el.strokeColor, isDark);
  const effectiveFill = getEffectiveBackgroundColor(el.backgroundColor, el.fillOpacity, isDark);

  // Use element's roughness unless override or clean mode selected
  const useRough = !isThumbnail && activeStyleMode === 'rough' && (el.roughness ?? 1) > 0;
  const roughOpts = {
    seed: el.seed || 1,
    stroke: effectiveStroke,
    strokeWidth: isThumbnail ? Math.max(el.strokeWidth || 2, 2 / zoom) : (el.strokeWidth || 2),
    roughness: el.roughness ?? (useRough ? 1.2 : 0),
    fill: effectiveFill,
    fillStyle: el.fillStyle === 'none' ? undefined : el.fillStyle,
    strokeLineDash:
      el.strokeStyle === 'dashed' ? [8, 6] : el.strokeStyle === 'dotted' ? [3, 4] : undefined,
  };

  const x = el.x;
  const y = el.y;
  const w = el.width;
  const h = el.height;

  // Move origin to element's (x, y) coordinates
  ctx.translate(x, y);

  // Rotation around element center
  if (el.angle && el.angle !== 0) {
    const cx = w / 2;
    const cy = h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(el.angle);
    ctx.translate(-cx, -cy);
  }

  // Figma Performance: Position-independent geometry cache key
  // Moving/dragging an element NEVER invalidates the rough shape cache!
  const baseKey = `${el.id}_${Math.round(w)}_${Math.round(h)}_${effectiveStroke}_${effectiveFill}_${roughOpts.fillStyle}_${roughOpts.strokeWidth}_${roughOpts.roughness}_${roughOpts.seed}_${el.strokeStyle}_${isDark}`;

  switch (el.type) {
    case 'rectangle': {
      if (useRough) {
        let cached = roughShapeCache.get(el.id);
        if (!cached || cached.key !== baseKey) {
          cached = {
            key: baseKey,
            drawable: generator.rectangle(0, 0, w, h, roughOpts),
          };
          roughShapeCache.set(el.id, cached);
        }
        rc.draw(cached.drawable);
      } else {
        renderCleanRect(ctx, 0, 0, w, h, el, isDark, isThumbnail, zoom);
      }
      renderElementText(ctx, el, isDark, allElements);
      break;
    }

    case 'diamond': {
      const top: [number, number] = [w / 2, 0];
      const right: [number, number] = [w, h / 2];
      const bottom: [number, number] = [w / 2, h];
      const left: [number, number] = [0, h / 2];

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
        applyCleanFillAndStroke(ctx, el, isDark, isThumbnail, zoom);
      }
      renderElementText(ctx, el, isDark, allElements);
      break;
    }

    case 'ellipse': {
      const cx = w / 2;
      const cy = h / 2;
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
        applyCleanFillAndStroke(ctx, el, isDark, isThumbnail, zoom);
      }
      renderElementText(ctx, el, isDark, allElements);
      break;
    }

    case 'sticky': {
      renderStickyNote(ctx, rc, el, useRough, isDark, allElements, isThumbnail, zoom);
      break;
    }

    case 'line': {
      if (el.points && el.points.length >= 2) {
        const p1 = el.points[0];
        const p2 = el.points[el.points.length - 1];
        if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 4) break;
        if (useRough) {
          let cached = roughShapeCache.get(el.id);
          const ptsKey = `${el.points.length}_${el.points[0]?.x}_${el.points[0]?.y}_${el.points[el.points.length - 1]?.x}_${el.points[el.points.length - 1]?.y}`;
          const lineKey = `${baseKey}_${ptsKey}`;
          if (!cached || cached.key !== lineKey) {
            const drawables = [];
            for (let i = 0; i < el.points.length - 1; i++) {
              drawables.push(
                generator.line(
                  el.points[i].x,
                  el.points[i].y,
                  el.points[i + 1].x,
                  el.points[i + 1].y,
                  roughOpts
                )
              );
            }
            cached = { key: lineKey, drawable: drawables };
            if (roughShapeCache.size > 1000) roughShapeCache.clear();
            roughShapeCache.set(el.id, cached);
          }
          if (Array.isArray(cached.drawable)) {
            for (const d of cached.drawable) {
              rc.draw(d);
            }
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          applyCleanStroke(ctx, el, isDark, isThumbnail, zoom);
        }
      }
      break;
    }

    case 'arrow': {
      renderArrow(ctx, rc, el, useRough, isDark, isThumbnail, zoom);
      break;
    }

    case 'draw': {
      if (el.points && el.points.length > 0) {
        ctx.beginPath();
        const strokeColor = effectiveStroke;
        const strokeWidth = isThumbnail ? Math.max(el.strokeWidth || 2, 2 / zoom) : (el.strokeWidth || 2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (el.points.length === 1) {
          ctx.arc(el.points[0].x, el.points[0].y, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = strokeColor;
          ctx.fill();
        } else if (el.points.length === 2) {
          ctx.moveTo(el.points[0].x, el.points[0].y);
          ctx.lineTo(el.points[1].x, el.points[1].y);
          ctx.stroke();
        } else {
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length - 1; i++) {
            const p1 = el.points[i];
            const p2 = el.points[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          }
          const last = el.points[el.points.length - 1];
          ctx.lineTo(last.x, last.y);
          ctx.stroke();
        }
      }
      break;
    }

    case 'text': {
      renderStandaloneText(ctx, el, isDark, allElements);
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
  isDark: boolean,
  isThumbnail?: boolean,
  zoom: number = 1
) {
  const r = Math.min(8, Math.min(w, h) / 4); // rounded corners for clean modern look
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  applyCleanFillAndStroke(ctx, el, isDark, isThumbnail, zoom);
}

function applyCleanFillAndStroke(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isDark: boolean,
  isThumbnail?: boolean,
  zoom: number = 1
) {
  let fill = getEffectiveBackgroundColor(el.backgroundColor, el.fillOpacity, isDark);
  if (isThumbnail && (!fill || fill === 'transparent' || el.fillStyle === 'none')) {
    fill = isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.15)';
  }
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = getEffectiveStrokeColor(el.strokeColor, isDark);
  ctx.lineWidth = isThumbnail ? Math.max(el.strokeWidth || 2, 1.8 / zoom) : (el.strokeWidth || 2);
  if (el.strokeStyle === 'dashed') ctx.setLineDash([8, 6]);
  else if (el.strokeStyle === 'dotted') ctx.setLineDash([3, 4]);
  else ctx.setLineDash([]);
  ctx.stroke();
}

function applyCleanStroke(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isDark: boolean,
  isThumbnail?: boolean,
  zoom: number = 1
) {
  ctx.strokeStyle = getEffectiveStrokeColor(el.strokeColor, isDark);
  ctx.lineWidth = isThumbnail ? Math.max(el.strokeWidth || 2, 1.8 / zoom) : (el.strokeWidth || 2);
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
  isDark: boolean,
  allElements?: CanvasElement[]
) {
  const { width: w, height: h } = el;
  const foldSize = 16;
  const rawBg =
    el.backgroundColor === 'contrast' || !el.backgroundColor
      ? isDark
        ? '#3b3218'
        : '#fef08a'
      : el.backgroundColor;
  const bgColor =
    getEffectiveBackgroundColor(rawBg, el.fillOpacity, isDark) || (isDark ? '#3b3218' : '#fef08a');
  const borderColor =
    getEffectiveStrokeColor(el.strokeColor, isDark) || (isDark ? '#eab308' : '#ca8a04');

  // Sticky body polygon with folded corner in local coordinates
  const p1 = [0, 0];
  const p2 = [w - foldSize, 0];
  const p3 = [w, foldSize];
  const p4 = [w, h];
  const p5 = [0, h];

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
  ctx.moveTo(w - foldSize, 0);
  ctx.lineTo(w - foldSize, foldSize);
  ctx.lineTo(w, foldSize);
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Sticky Text using Lobster Two with adaptive contrast
  if (el.text) {
    ctx.save();
    ctx.fillStyle = getEffectiveTextColor(
      el.textColor,
      { ...el, backgroundColor: rawBg },
      isDark,
      allElements
    );
    ctx.font = `600 ${el.fontSize || 16}px 'Lobster Two', cursive, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const lines = el.text.split('\n');
    const lineHeight = (el.fontSize || 14) * 1.35;
    lines.forEach((line, index) => {
      ctx.fillText(line, 12, 14 + index * lineHeight);
    });
    ctx.restore();
  }
}

function renderArrow(
  ctx: CanvasRenderingContext2D,
  rc: any,
  el: CanvasElement,
  useRough: boolean,
  isDark: boolean,
  isThumbnail?: boolean,
  zoom: number = 1
) {
  const points = el.points || [
    { x: 0, y: 0 },
    { x: el.width, y: el.height },
  ];
  if (points.length < 2) return;

  const startX = points[0].x;
  const startY = points[0].y;
  const endX = points[points.length - 1].x;
  const endY = points[points.length - 1].y;

  const length = Math.hypot(endX - startX, endY - startY);
  if (length < 4) return;

  const strokeColor = getEffectiveStrokeColor(el.strokeColor, isDark);
  const strokeWidth = isThumbnail ? Math.max(el.strokeWidth || 2, 2 / zoom) : (el.strokeWidth || 2);

  // Draw arrow shaft
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Draw sleek filled arrowhead at the end (Eraser diagram standard)
  const angle = Math.atan2(endY - points[points.length - 2].y, endX - points[points.length - 2].x);
  const headLen = Math.min(13 + strokeWidth * 1.5, Math.max(9, length * 0.35));

  ctx.fillStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLen * Math.cos(angle - Math.PI / 6.5),
    endY - headLen * Math.sin(angle - Math.PI / 6.5)
  );
  ctx.lineTo(
    endX - headLen * 0.75 * Math.cos(angle),
    endY - headLen * 0.75 * Math.sin(angle)
  );
  ctx.lineTo(
    endX - headLen * Math.cos(angle + Math.PI / 6.5),
    endY - headLen * Math.sin(angle + Math.PI / 6.5)
  );
  ctx.closePath();
  ctx.fill();

  // Optional start arrowhead if bidirectional
  if (el.startArrowhead === 'arrow') {
    const startAngle = Math.atan2(points[1].y - startY, points[1].x - startX);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(
      startX + headLen * Math.cos(startAngle + Math.PI / 6.5),
      startY + headLen * Math.sin(startAngle + Math.PI / 6.5)
    );
    ctx.lineTo(
      startX + headLen * 0.75 * Math.cos(startAngle),
      startY + headLen * 0.75 * Math.sin(startAngle)
    );
    ctx.lineTo(
      startX + headLen * Math.cos(startAngle - Math.PI / 6.5),
      startY + headLen * Math.sin(startAngle - Math.PI / 6.5)
    );
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function renderElementText(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isDark: boolean,
  allElements?: CanvasElement[]
) {
  if (!el.text) return;
  ctx.save();
  ctx.fillStyle = getEffectiveTextColor(el.textColor, el, isDark, allElements);
  ctx.font = `600 ${el.fontSize || 14}px 'Teachers', 'Inter', sans-serif`;
  ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'center';
  ctx.textBaseline = 'middle';

  const lines = el.text.split('\n');
  const lineHeight = (el.fontSize || 14) * 1.35;
  const totalHeight = lines.length * lineHeight;
  const startY = el.height / 2 - totalHeight / 2 + lineHeight / 2;

  const textX =
    el.textAlign === 'left'
      ? 12
      : el.textAlign === 'right'
      ? el.width - 12
      : el.width / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, startY + index * lineHeight);
  });
  ctx.restore();
}

function renderStandaloneText(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isDark: boolean,
  allElements?: CanvasElement[]
) {
  if (!el.text) return;
  ctx.save();
  ctx.fillStyle = getEffectiveTextColor(el.textColor, el, isDark, allElements);
  ctx.font = `500 ${el.fontSize || 18}px 'Teachers', 'Inter', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const lines = el.text.split('\n');
  const lineHeight = (el.fontSize || 18) * 1.35;
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, index * lineHeight);
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
    if (el.type === 'arrow' || el.type === 'line') {
      const points = el.points || [
        { x: 0, y: 0 },
        { x: el.width, y: el.height },
      ];
      const startPt = { x: el.x + points[0].x, y: el.y + points[0].y };
      const endPt = { x: el.x + points[points.length - 1].x, y: el.y + points[points.length - 1].y };

      const handleRadius = 6 / zoom;

      // Start endpoint handle (round grab handle)
      ctx.beginPath();
      ctx.arc(startPt.x, startPt.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5 / zoom;
      ctx.stroke();

      // End endpoint handle (round grab handle)
      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5 / zoom;
      ctx.stroke();

      continue;
    }

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
