import { CanvasElement, Point, AnchorPosition } from '@rea/shared-types';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'start'
  | 'end';

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function getElementBounds(el: CanvasElement): BoundingBox {
  if (el.type === 'draw' || el.type === 'line' || el.type === 'arrow') {
    if (!el.points || el.points.length === 0) {
      return {
        minX: el.x,
        minY: el.y,
        maxX: el.x + el.width,
        maxY: el.y + el.height,
        width: Math.abs(el.width),
        height: Math.abs(el.height),
      };
    }
    const absPoints = el.points.map((p) => ({ x: el.x + p.x, y: el.y + p.y }));
    const xs = absPoints.map((p) => p.x);
    const ys = absPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(20, maxX - minX),
      height: Math.max(20, maxY - minY),
    };
  }

  const minX = Math.min(el.x, el.x + el.width);
  const maxX = Math.max(el.x, el.x + el.width);
  const minY = Math.min(el.y, el.y + el.height);
  const maxY = Math.max(el.y, el.y + el.height);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getGroupBounds(elements: CanvasElement[]): BoundingBox | null {
  if (elements.length === 0) return null;
  const bounds = elements.map(getElementBounds);
  const minX = Math.min(...bounds.map((b) => b.minX));
  const minY = Math.min(...bounds.map((b) => b.minY));
  const maxX = Math.max(...bounds.map((b) => b.maxX));
  const maxY = Math.max(...bounds.map((b) => b.maxY));
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function isPointInElement(point: Point, el: CanvasElement): boolean {
  const bounds = getElementBounds(el);
  const padding = Math.max(8, el.strokeWidth);

  // Quick bounding box check
  if (
    point.x < bounds.minX - padding ||
    point.x > bounds.maxX + padding ||
    point.y < bounds.minY - padding ||
    point.y > bounds.maxY + padding
  ) {
    return false;
  }

  if (el.type === 'rectangle' || el.type === 'sticky') {
    return (
      point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.y >= bounds.minY &&
      point.y <= bounds.maxY
    );
  }

  if (el.type === 'ellipse') {
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    const cx = bounds.minX + rx;
    const cy = bounds.minY + ry;
    if (rx === 0 || ry === 0) return false;
    const normX = (point.x - cx) / (rx + padding);
    const normY = (point.y - cy) / (ry + padding);
    return normX * normX + normY * normY <= 1;
  }

  if (el.type === 'diamond') {
    const cx = bounds.minX + bounds.width / 2;
    const cy = bounds.minY + bounds.height / 2;
    const dx = Math.abs(point.x - cx);
    const dy = Math.abs(point.y - cy);
    const w = bounds.width / 2 + padding;
    const h = bounds.height / 2 + padding;
    return dx / w + dy / h <= 1;
  }

  if (el.type === 'line' || el.type === 'arrow') {
    if (el.points && el.points.length >= 2) {
      for (let i = 0; i < el.points.length - 1; i++) {
        const p1 = { x: el.x + el.points[i].x, y: el.y + el.points[i].y };
        const p2 = { x: el.x + el.points[i + 1].x, y: el.y + el.points[i + 1].y };
        if (distanceToSegment(point, p1, p2) <= padding + 4) {
          return true;
        }
      }
    }
    return false;
  }

  if (el.type === 'draw') {
    if (el.points && el.points.length > 0) {
      if (el.points.length === 1) {
        return distance(point, { x: el.x + el.points[0].x, y: el.y + el.points[0].y }) <= padding + 6;
      }
      for (let i = 0; i < el.points.length - 1; i++) {
        const p1 = { x: el.x + el.points[i].x, y: el.y + el.points[i].y };
        const p2 = { x: el.x + el.points[i + 1].x, y: el.y + el.points[i + 1].y };
        if (distanceToSegment(point, p1, p2) <= padding + 6) {
          return true;
        }
      }
    }
    return false;
  }

  if (el.type === 'text') {
    return (
      point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.y >= bounds.minY &&
      point.y <= bounds.maxY
    );
  }

  return true;
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

export function getResizeHandles(bounds: BoundingBox, zoom: number): { handle: ResizeHandle; x: number; y: number }[] {
  const { minX, minY, maxX, maxY, width, height } = bounds;
  const midX = minX + width / 2;
  const midY = minY + height / 2;

  return [
    { handle: 'nw', x: minX, y: minY },
    { handle: 'n', x: midX, y: minY },
    { handle: 'ne', x: maxX, y: minY },
    { handle: 'e', x: maxX, y: midY },
    { handle: 'se', x: maxX, y: maxY },
    { handle: 's', x: midX, y: maxY },
    { handle: 'sw', x: minX, y: maxY },
    { handle: 'w', x: minX, y: midY },
  ];
}

export function getHitResizeHandle(point: Point, bounds: BoundingBox, zoom: number): ResizeHandle | null {
  const handles = getResizeHandles(bounds, zoom);
  const handleRadius = 8 / zoom;

  for (const h of handles) {
    if (distance(point, { x: h.x, y: h.y }) <= handleRadius) {
      return h.handle;
    }
  }
  return null;
}

export function snapToGrid(val: number, gridSize = 16): number {
  return Math.round(val / gridSize) * gridSize;
}

// --- Shape Anchor & Dynamic Connector System ---

export interface ShapeAnchor extends Point {
  position: AnchorPosition;
  elementId: string;
}

export function getAnchorCoordinates(shape: CanvasElement, position: AnchorPosition): Point {
  const bounds = getElementBounds(shape);
  const midX = bounds.minX + bounds.width / 2;
  const midY = bounds.minY + bounds.height / 2;

  switch (position) {
    case 'top':
      return { x: midX, y: bounds.minY };
    case 'right':
      return { x: bounds.maxX, y: midY };
    case 'bottom':
      return { x: midX, y: bounds.maxY };
    case 'left':
      return { x: bounds.minX, y: midY };
    case 'center':
    default:
      return { x: midX, y: midY };
  }
}

export function getShapeAnchors(el: CanvasElement): ShapeAnchor[] {
  if (
    el.isDeleted ||
    el.type === 'arrow' ||
    el.type === 'line' ||
    el.type === 'draw' ||
    el.type === 'selection'
  ) {
    return [];
  }

  const bounds = getElementBounds(el);
  const midX = bounds.minX + bounds.width / 2;
  const midY = bounds.minY + bounds.height / 2;

  return [
    { x: midX, y: bounds.minY, position: 'top', elementId: el.id },
    { x: bounds.maxX, y: midY, position: 'right', elementId: el.id },
    { x: midX, y: bounds.maxY, position: 'bottom', elementId: el.id },
    { x: bounds.minX, y: midY, position: 'left', elementId: el.id },
    { x: midX, y: midY, position: 'center', elementId: el.id },
  ];
}

export function findNearestShapeAnchor(
  point: Point,
  elements: CanvasElement[],
  maxDistance = 24,
  excludeId?: string
): ShapeAnchor | null {
  let nearest: ShapeAnchor | null = null;
  let minDistance = maxDistance;

  for (const el of elements) {
    if (el.isDeleted || el.id === excludeId) continue;
    const anchors = getShapeAnchors(el);
    for (const anchor of anchors) {
      const d = distance(point, { x: anchor.x, y: anchor.y });
      if (d < minDistance) {
        minDistance = d;
        nearest = anchor;
      }
    }
  }

  return nearest;
}

export function updateBoundArrows(
  elements: CanvasElement[],
  movedElementIds: string[]
): CanvasElement[] {
  if (movedElementIds.length === 0) {
    return elements;
  }

  const movedSet = new Set(movedElementIds);
  const elementMap = new Map<string, CanvasElement>(elements.map((el) => [el.id, el]));
  let hasChanges = false;

  const updatedElements = elements.map((el) => {
    if (el.type !== 'arrow' && el.type !== 'line') {
      return el;
    }

    const hasStartBound = el.startBinding && movedSet.has(el.startBinding.elementId);
    const hasEndBound = el.endBinding && movedSet.has(el.endBinding.elementId);

    if (!hasStartBound && !hasEndBound) {
      return el;
    }

    const points = el.points ? [...el.points] : [
      { x: 0, y: 0 },
      { x: el.width, y: el.height },
    ];

    let newElX = el.x;
    let newElY = el.y;

    if (hasStartBound && el.startBinding) {
      const targetShape = elementMap.get(el.startBinding.elementId);
      if (targetShape && !targetShape.isDeleted) {
        const anchorPos = el.startBinding.anchorPosition || 'center';
        const anchorCoord = getAnchorCoordinates(targetShape, anchorPos);

        const currentAbsEnd = {
          x: el.x + points[points.length - 1].x,
          y: el.y + points[points.length - 1].y,
        };

        newElX = anchorCoord.x;
        newElY = anchorCoord.y;
        points[0] = { x: 0, y: 0 };
        points[points.length - 1] = {
          x: currentAbsEnd.x - anchorCoord.x,
          y: currentAbsEnd.y - anchorCoord.y,
        };
        hasChanges = true;
      }
    }

    if (hasEndBound && el.endBinding) {
      const targetShape = elementMap.get(el.endBinding.elementId);
      if (targetShape && !targetShape.isDeleted) {
        const anchorPos = el.endBinding.anchorPosition || 'center';
        const anchorCoord = getAnchorCoordinates(targetShape, anchorPos);

        points[points.length - 1] = {
          x: anchorCoord.x - newElX,
          y: anchorCoord.y - newElY,
        };
        hasChanges = true;
      }
    }

    if (!hasChanges) return el;

    const newWidth = points[points.length - 1].x;
    const newHeight = points[points.length - 1].y;

    return {
      ...el,
      x: newElX,
      y: newElY,
      width: newWidth,
      height: newHeight,
      points,
      version: el.version + 1,
      versionNonce: Math.floor(Math.random() * 100000),
      updatedAt: Date.now(),
    };
  });

  return updatedElements;
}
