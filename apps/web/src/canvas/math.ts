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
  | 'end'
  | 'rotation';

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function rotatePoint(p: Point, center: Point, angle: number): Point {
  if (!angle) return p;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  };
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
  // If element is rotated, transform test point by negative angle around element center
  let testPoint = point;
  if (el.angle && el.angle !== 0) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    testPoint = rotatePoint(point, { x: cx, y: cy }, -el.angle);
  }

  const bounds = getElementBounds(el);
  const padding = Math.max(8, el.strokeWidth);

  // Quick bounding box check
  if (
    testPoint.x < bounds.minX - padding ||
    testPoint.x > bounds.maxX + padding ||
    testPoint.y < bounds.minY - padding ||
    testPoint.y > bounds.maxY + padding
  ) {
    return false;
  }

  if (el.type === 'frame') {
    const badgeTop = bounds.minY - 26;
    return (
      testPoint.x >= bounds.minX &&
      testPoint.x <= bounds.maxX &&
      testPoint.y >= badgeTop &&
      testPoint.y <= bounds.maxY
    );
  }

  if (el.type === 'rectangle' || el.type === 'sticky' || el.type === 'image') {
    return (
      testPoint.x >= bounds.minX &&
      testPoint.x <= bounds.maxX &&
      testPoint.y >= bounds.minY &&
      testPoint.y <= bounds.maxY
    );
  }

  if (el.type === 'ellipse') {
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    const cx = bounds.minX + rx;
    const cy = bounds.minY + ry;
    if (rx === 0 || ry === 0) return false;
    const normX = (testPoint.x - cx) / (rx + padding);
    const normY = (testPoint.y - cy) / (ry + padding);
    return normX * normX + normY * normY <= 1;
  }

  if (el.type === 'diamond') {
    const cx = bounds.minX + bounds.width / 2;
    const cy = bounds.minY + bounds.height / 2;
    const dx = Math.abs(testPoint.x - cx);
    const dy = Math.abs(testPoint.y - cy);
    const w = bounds.width / 2 + padding;
    const h = bounds.height / 2 + padding;
    return dx / w + dy / h <= 1;
  }

  if (el.type === 'line' || el.type === 'arrow') {
    if (el.points && el.points.length >= 2) {
      for (let i = 0; i < el.points.length - 1; i++) {
        const p1 = { x: el.x + el.points[i].x, y: el.y + el.points[i].y };
        const p2 = { x: el.x + el.points[i + 1].x, y: el.y + el.points[i + 1].y };
        if (distanceToSegment(testPoint, p1, p2) <= padding + 4) {
          return true;
        }
      }
    }
    return false;
  }

  if (el.type === 'draw') {
    if (el.points && el.points.length > 0) {
      if (el.points.length === 1) {
        return distance(testPoint, { x: el.x + el.points[0].x, y: el.y + el.points[0].y }) <= padding + 6;
      }
      for (let i = 0; i < el.points.length - 1; i++) {
        const p1 = { x: el.x + el.points[i].x, y: el.y + el.points[i].y };
        const p2 = { x: el.x + el.points[i + 1].x, y: el.y + el.points[i + 1].y };
        if (distanceToSegment(testPoint, p1, p2) <= padding + 6) {
          return true;
        }
      }
    }
    return false;
  }

  if (el.type === 'text') {
    return (
      testPoint.x >= bounds.minX &&
      testPoint.x <= bounds.maxX &&
      testPoint.y >= bounds.minY &&
      testPoint.y <= bounds.maxY
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

export function getRotationHandle(bounds: BoundingBox, zoom: number, angle = 0): Point {
  const midX = bounds.minX + bounds.width / 2;
  const stalkDist = 30 / zoom;
  const rawHandle = { x: midX, y: bounds.minY - stalkDist };
  if (!angle) return rawHandle;
  const center = { x: midX, y: bounds.minY + bounds.height / 2 };
  return rotatePoint(rawHandle, center, angle);
}

export function getResizeHandles(
  bounds: BoundingBox,
  zoom: number,
  angle = 0
): { handle: ResizeHandle; x: number; y: number }[] {
  const { minX, minY, maxX, maxY, width, height } = bounds;
  const midX = minX + width / 2;
  const midY = minY + height / 2;
  const center = { x: midX, y: midY };

  const rawHandles: { handle: ResizeHandle; x: number; y: number }[] = [
    { handle: 'nw', x: minX, y: minY },
    { handle: 'n', x: midX, y: minY },
    { handle: 'ne', x: maxX, y: minY },
    { handle: 'e', x: maxX, y: midY },
    { handle: 'se', x: maxX, y: maxY },
    { handle: 's', x: midX, y: maxY },
    { handle: 'sw', x: minX, y: maxY },
    { handle: 'w', x: minX, y: midY },
  ];

  if (!angle) return rawHandles;

  return rawHandles.map((h) => {
    const rot = rotatePoint({ x: h.x, y: h.y }, center, angle);
    return { handle: h.handle, x: rot.x, y: rot.y };
  });
}

export function getHitResizeHandle(
  point: Point,
  bounds: BoundingBox,
  zoom: number,
  angle = 0
): ResizeHandle | null {
  // 1. Check rotation handle first
  const rotHandle = getRotationHandle(bounds, zoom, angle);
  const rotRadius = 14 / zoom;
  if (distance(point, rotHandle) <= rotRadius) {
    return 'rotation';
  }

  // 2. Check 8 resize handles
  const handles = getResizeHandles(bounds, zoom, angle);
  const handleRadius = 9 / zoom;

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

  // Figma/Miro perimeter anchor ports (top, right, bottom, left)
  return [
    { x: midX, y: bounds.minY, position: 'top', elementId: el.id },
    { x: bounds.maxX, y: midY, position: 'right', elementId: el.id },
    { x: midX, y: bounds.maxY, position: 'bottom', elementId: el.id },
    { x: bounds.minX, y: midY, position: 'left', elementId: el.id },
  ];
}

export function findNearestShapeAnchor(
  point: Point,
  elements: CanvasElement[],
  maxDistance = 40,
  excludeId?: string
): ShapeAnchor | null {
  let nearest: ShapeAnchor | null = null;
  let minDistance = Infinity;

  // Search candidate shapes in reverse order (topmost z-index shape first)
  const candidateElements = [...elements].reverse().filter(
    (el) =>
      !el.isDeleted &&
      el.id !== excludeId &&
      el.type !== 'arrow' &&
      el.type !== 'line' &&
      el.type !== 'draw' &&
      el.type !== 'selection'
  );

  // 1. First prioritize shape whose bounding box contains or is in generous proximity to point
  for (const el of candidateElements) {
    const bounds = getElementBounds(el);
    const isInsideOrNear =
      point.x >= bounds.minX - maxDistance &&
      point.x <= bounds.maxX + maxDistance &&
      point.y >= bounds.minY - maxDistance &&
      point.y <= bounds.maxY + maxDistance;

    if (!isInsideOrNear) continue;

    const anchors = getShapeAnchors(el);
    for (const anchor of anchors) {
      const d = distance(point, { x: anchor.x, y: anchor.y });
      if (d < minDistance) {
        minDistance = d;
        nearest = anchor;
      }
    }

    // If point is strictly inside this shape, stop and snap to this shape's closest port
    if (
      point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.y >= bounds.minY &&
      point.y <= bounds.maxY &&
      nearest
    ) {
      return nearest;
    }
  }

  if (nearest && minDistance <= maxDistance * 2.5) {
    return nearest;
  }

  // 2. Direct euclidean distance fallback
  minDistance = maxDistance;
  let fallback: ShapeAnchor | null = null;
  for (const el of candidateElements) {
    const anchors = getShapeAnchors(el);
    for (const anchor of anchors) {
      const d = distance(point, { x: anchor.x, y: anchor.y });
      if (d < minDistance) {
        minDistance = d;
        fallback = anchor;
      }
    }
  }

  return fallback;
}

export function updateBoundArrows(
  elements: CanvasElement[],
  movedElementIds: string[]
): CanvasElement[] {
  if (movedElementIds.length === 0) {
    return elements;
  }

  // Fast path: if no elements are connectors with bindings, return immediately!
  const hasBindings = elements.some(
    (el) => (el.type === 'arrow' || el.type === 'line') && (el.startBinding || el.endBinding)
  );
  if (!hasBindings) {
    return elements;
  }

  const movedSet = new Set(movedElementIds);
  const elementMap = new Map<string, CanvasElement>(elements.map((el) => [el.id, el]));
  let hasChanges = false;

  const updatedElements = elements.map((el) => {
    if (el.type !== 'arrow' && el.type !== 'line') {
      return el;
    }

    const startBound = el.startBinding ? elementMap.get(el.startBinding.elementId) : undefined;
    const endBound = el.endBinding ? elementMap.get(el.endBinding.elementId) : undefined;

    const isStartBound = Boolean(startBound && !startBound.isDeleted);
    const isEndBound = Boolean(endBound && !endBound.isDeleted);

    if (!isStartBound && !isEndBound) {
      return el;
    }

    const isStartMoved = el.startBinding ? movedSet.has(el.startBinding.elementId) : false;
    const isEndMoved = el.endBinding ? movedSet.has(el.endBinding.elementId) : false;

    // Only update if at least one of its anchored shapes was moved or resized
    if (!isStartMoved && !isEndMoved) {
      return el;
    }

    const points =
      el.points && el.points.length >= 2
        ? el.points.map((p) => ({ ...p }))
        : [
            { x: 0, y: 0 },
            { x: el.width, y: el.height },
          ];

    // Compute absolute start coordinate
    let absStartX = el.x;
    let absStartY = el.y;

    if (isStartBound && startBound && el.startBinding) {
      const coord = getAnchorCoordinates(startBound, el.startBinding.anchorPosition || 'center');
      absStartX = coord.x;
      absStartY = coord.y;
    }

    // Compute absolute end coordinate
    let absEndX = el.x + points[points.length - 1].x;
    let absEndY = el.y + points[points.length - 1].y;

    if (isEndBound && endBound && el.endBinding) {
      const coord = getAnchorCoordinates(endBound, el.endBinding.anchorPosition || 'center');
      absEndX = coord.x;
      absEndY = coord.y;
    }

    const relEndX = absEndX - absStartX;
    const relEndY = absEndY - absStartY;

    points[0] = { x: 0, y: 0 };
    points[points.length - 1] = { x: relEndX, y: relEndY };

    hasChanges = true;

    return {
      ...el,
      x: absStartX,
      y: absStartY,
      width: relEndX,
      height: relEndY,
      points,
      version: el.version + 1,
      versionNonce: Math.floor(Math.random() * 100000),
      updatedAt: Date.now(),
    };
  });

  return hasChanges ? updatedElements : elements;
}

// --- Excalidraw Alignment & Distribution Utilities ---

export function alignElements(
  elements: CanvasElement[],
  selectedIds: string[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): CanvasElement[] {
  const selected = elements.filter((el) => selectedIds.includes(el.id) && !el.isDeleted);
  if (selected.length < 2) return elements;

  const groupBounds = getGroupBounds(selected);
  if (!groupBounds) return elements;

  return elements.map((el) => {
    if (!selectedIds.includes(el.id) || el.isDeleted || el.locked) return el;
    const b = getElementBounds(el);
    let newX = el.x;
    let newY = el.y;

    switch (alignment) {
      case 'left':
        newX = groupBounds.minX;
        break;
      case 'center':
        newX = groupBounds.minX + (groupBounds.width - b.width) / 2;
        break;
      case 'right':
        newX = groupBounds.maxX - b.width;
        break;
      case 'top':
        newY = groupBounds.minY;
        break;
      case 'middle':
        newY = groupBounds.minY + (groupBounds.height - b.height) / 2;
        break;
      case 'bottom':
        newY = groupBounds.maxY - b.height;
        break;
    }

    return {
      ...el,
      x: Math.round(newX),
      y: Math.round(newY),
      version: el.version + 1,
      updatedAt: Date.now(),
    };
  });
}

export function distributeElements(
  elements: CanvasElement[],
  selectedIds: string[],
  direction: 'horizontal' | 'vertical'
): CanvasElement[] {
  const selected = elements.filter((el) => selectedIds.includes(el.id) && !el.isDeleted);
  if (selected.length < 3) return elements;

  if (direction === 'horizontal') {
    const sorted = [...selected].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = (last.x + last.width) - first.x;
    const sumWidths = sorted.reduce((sum, item) => sum + item.width, 0);
    const availableGap = totalSpan - sumWidths;
    const gap = availableGap / (sorted.length - 1);

    let curX = first.x;
    const xMap = new Map<string, number>();
    for (const item of sorted) {
      xMap.set(item.id, curX);
      curX += item.width + gap;
    }

    return elements.map((el) => {
      if (xMap.has(el.id) && !el.locked) {
        return {
          ...el,
          x: Math.round(xMap.get(el.id)!),
          version: el.version + 1,
          updatedAt: Date.now(),
        };
      }
      return el;
    });
  } else {
    const sorted = [...selected].sort((a, b) => a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = (last.y + last.height) - first.y;
    const sumHeights = sorted.reduce((sum, item) => sum + item.height, 0);
    const availableGap = totalSpan - sumHeights;
    const gap = availableGap / (sorted.length - 1);

    let curY = first.y;
    const yMap = new Map<string, number>();
    for (const item of sorted) {
      yMap.set(item.id, curY);
      curY += item.height + gap;
    }

    return elements.map((el) => {
      if (yMap.has(el.id) && !el.locked) {
        return {
          ...el,
          y: Math.round(yMap.get(el.id)!),
          version: el.version + 1,
          updatedAt: Date.now(),
        };
      }
      return el;
    });
  }
}

export function flipElements(
  elements: CanvasElement[],
  selectedIds: string[],
  direction: 'horizontal' | 'vertical'
): CanvasElement[] {
  const selected = elements.filter((el) => selectedIds.includes(el.id) && !el.isDeleted);
  if (selected.length === 0) return elements;

  const bounds = getGroupBounds(selected);
  if (!bounds) return elements;

  return elements.map((el) => {
    if (!selectedIds.includes(el.id) || el.isDeleted || el.locked) return el;

    if (direction === 'horizontal') {
      const elBounds = getElementBounds(el);
      const newX = bounds.minX + (bounds.maxX - elBounds.maxX);
      let updatedPoints = el.points;
      if (el.points && el.points.length > 0) {
        updatedPoints = el.points.map((p) => ({
          x: el.width - p.x,
          y: p.y,
        }));
      }
      return {
        ...el,
        x: newX,
        points: updatedPoints,
        flipX: !el.flipX,
        version: el.version + 1,
        updatedAt: Date.now(),
      };
    } else {
      const elBounds = getElementBounds(el);
      const newY = bounds.minY + (bounds.maxY - elBounds.maxY);
      let updatedPoints = el.points;
      if (el.points && el.points.length > 0) {
        updatedPoints = el.points.map((p) => ({
          x: p.x,
          y: el.height - p.y,
        }));
      }
      return {
        ...el,
        y: newY,
        points: updatedPoints,
        flipY: !el.flipY,
        version: el.version + 1,
        updatedAt: Date.now(),
      };
    }
  });
}

export function groupElements(
  elements: CanvasElement[],
  selectedIds: string[]
): { elements: CanvasElement[]; newGroupId: string } {
  const newGroupId = `grp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const updated = elements.map((el) => {
    if (selectedIds.includes(el.id) && !el.isDeleted) {
      const existing = el.groupIds || [];
      return {
        ...el,
        groupIds: [...existing, newGroupId],
        version: el.version + 1,
        updatedAt: Date.now(),
      };
    }
    return el;
  });
  return { elements: updated, newGroupId };
}

export function ungroupElements(
  elements: CanvasElement[],
  selectedIds: string[]
): CanvasElement[] {
  return elements.map((el) => {
    if (selectedIds.includes(el.id) && !el.isDeleted && el.groupIds && el.groupIds.length > 0) {
      const newGroupIds = [...el.groupIds];
      newGroupIds.pop(); // Remove innermost group
      return {
        ...el,
        groupIds: newGroupIds.length > 0 ? newGroupIds : undefined,
        version: el.version + 1,
        updatedAt: Date.now(),
      };
    }
    return el;
  });
}

