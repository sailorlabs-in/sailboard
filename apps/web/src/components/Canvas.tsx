import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasElement, ElementType, Point, UserPresence, ArrowBinding } from '@rea/shared-types';
import {
  getElementBounds,
  getGroupBounds,
  getHitResizeHandle,
  isPointInElement,
  ResizeHandle,
  snapToGrid,
  BoundingBox,
  distance,
  ShapeAnchor,
  getShapeAnchors,
  findNearestShapeAnchor,
  updateBoundArrows,
} from '../canvas/math';
import { renderScene } from '../canvas/renderer';
import { socketService } from '../services/socket';
import { getEffectiveTextColor } from '../utils/colorUtils';
import { getFigmaCursor } from '../canvas/cursors';
import gsap from 'gsap';

// Animated spring pill indicator for Hand tool
function HandToolPill({
  isSpacePressed,
  theme,
}: {
  isSpacePressed: boolean;
  theme: 'light' | 'dark';
}) {
  const pillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pillRef.current) {
      gsap.fromTo(
        pillRef.current,
        { y: 24, opacity: 0, scale: 0.88 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }
      );
    }
  }, []);

  return (
    <div
      ref={pillRef}
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 18px',
        borderRadius: '24px',
        backgroundColor: theme === 'dark' ? '#1c2030' : '#e6ecf2',
        boxShadow:
          theme === 'dark'
            ? '6px 6px 16px rgba(0,0,0,0.5), -4px -4px 10px rgba(255,255,255,0.05)'
            : '6px 6px 16px #c2c9d1, -6px -6px 16px #ffffff',
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.8)',
        color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
        fontSize: '12px',
        fontWeight: 600,
        zIndex: 30,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '15px' }}>✋</span>
      <span>Hand Tool Active {isSpacePressed ? '(Space held)' : ''} • Drag to Pan</span>
    </div>
  );
}

interface CanvasProps {
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[], recordHistory?: boolean) => void;
  selectedElementIds: string[];
  onSelectElements: (ids: string[]) => void;
  activeTool: ElementType | 'eraser' | 'pan' | 'comment';
  onToolChange: (tool: ElementType | 'eraser' | 'pan' | 'comment') => void;
  onDropCommentPin?: (point: Point) => void;
  theme: 'light' | 'dark';
  styleMode: 'rough' | 'clean';
  gridVisible: boolean;
  gridSnap: boolean;
  gridType: 'dots' | 'grid' | 'blank';
  zoom: number;
  onZoomChange: (zoom: number) => void;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  currentStyle: {
    strokeColor: string;
    backgroundColor: string;
    textColor?: string;
    fillStyle: 'none' | 'solid' | 'hachure' | 'cross-hatch';
    strokeWidth: number;
    strokeStyle: 'solid' | 'dashed' | 'dotted';
    roughness: number;
    opacity: number;
    fontSize: number;
    fillOpacity?: number;
  };
  remoteUsers: UserPresence[];
  onCursorMove: (point: Point) => void;
  isViewer?: boolean;
  canComment?: boolean;
  onInteractionChange?: (isInteracting: boolean) => void;
}

function CanvasComponent({
  elements,
  onElementsChange,
  selectedElementIds,
  onSelectElements,
  activeTool,
  onToolChange,
  onDropCommentPin,
  theme,
  styleMode,
  gridVisible,
  gridSnap,
  gridType,
  zoom,
  onZoomChange,
  pan,
  onPanChange,
  currentStyle,
  remoteUsers,
  onCursorMove,
  isViewer,
  canComment = true,
  onInteractionChange,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  type DragState = {
    mode: 'none' | 'drawing' | 'moving' | 'resizing' | 'box-select' | 'panning';
    startPos: Point;
    lastPos: Point;
    activeHandle: ResizeHandle | null;
    createdElementId: string | null;
    initialBounds?: BoundingBox;
    elementStartPositions?: Map<string, { x: number; y: number }>;
  };

  const [dragState, setDragState] = useState<DragState>({
    mode: 'none',
    startPos: { x: 0, y: 0 },
    lastPos: { x: 0, y: 0 },
    activeHandle: null,
    createdElementId: null,
  });
  const dragStateRef = useRef<DragState>(dragState);

  const updateDragState = useCallback((next: DragState) => {
    dragStateRef.current = next;
    setDragState(next);
  }, []);

  const selectionBoxRef = useRef<BoundingBox | null>(null);
  const hoveredHandleRef = useRef<ResizeHandle | null>(null);
  const lastSocketEmitRef = useRef<number>(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const previousToolRef = useRef<ElementType | 'eraser' | 'pan' | 'comment'>('selection');

  // Dynamic Anchor Connector State (refs only - prevents React re-render thrashing during pointer move)
  const candidateAnchorsRef = useRef<ShapeAnchor[]>([]);
  const activeSnapAnchorRef = useRef<ShapeAnchor | null>(null);
  const startBindingRef = useRef<ArrowBinding | undefined>(undefined);
  const endBindingRef = useRef<ArrowBinding | undefined>(undefined);

  const latestElementsRef = useRef(elements);
  if (dragStateRef.current.mode === 'none') {
    latestElementsRef.current = elements;
  }

  // Spacebar Hand Tool (Hold Space to temporarily pan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        previousToolRef.current = activeTool;
        if (activeTool !== 'pan') {
          onToolChange('pan');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        if (previousToolRef.current && previousToolRef.current !== 'pan') {
          onToolChange(previousToolRef.current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool, onToolChange]);

  // Inline Text Editing State
  const [editingTextElement, setEditingTextElement] = useState<{
    elementId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    textColor?: string;
    fontSize?: number;
  } | null>(null);

  // Figma Optimization: Decoupled Camera State
  // Panning and zooming update mutable cameraRef and repaint via requestAnimationFrame
  // without triggering expensive 2000-line React App re-renders on every mouse pixel
  const cameraRef = useRef<{ pan: { x: number; y: number }; zoom: number }>({
    pan: { ...pan },
    zoom,
  });
  const panLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoveredShapeIdRef = useRef<string | null>(null);
  const currentSnapAnchorRef = useRef<ShapeAnchor | null>(null);

  // Figma Performance: Interaction Shield
  // When true (during active drag, scroll, or pinch), incoming stale pan/zoom props
  // from React parent re-renders are ignored, eliminating camera rubber-banding and jitter.
  const isUserInteractingRef = useRef(false);
  const wheelIdleTimerRef = useRef<any>(null);

  // Pending Camera Sync: Synchronize onPanChange & onZoomChange with parent on gesture completion
  const pendingPanSyncRef = useRef<{ x: number; y: number } | null>(null);
  const pendingZoomSyncRef = useRef<number | null>(null);

  // Figma Interaction: Immediately toggle comments overlay visibility at 0ms latency during viewport movement
  const setCommentsOverlayVisibility = useCallback((visible: boolean) => {
    const overlay = document.getElementById('sailboard-comments-overlay');
    if (overlay) {
      overlay.style.opacity = visible ? '1' : '0';
    }
    const popovers = document.querySelectorAll('.sailboard-comment-popover');
    popovers.forEach((p) => {
      (p as HTMLElement).style.opacity = visible ? '1' : '0';
      (p as HTMLElement).style.pointerEvents = visible ? 'auto' : 'none';
    });
  }, []);

  const flushCameraSync = useCallback(() => {
    if (wheelIdleTimerRef.current) {
      clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = null;
    }
    setCommentsOverlayVisibility(true);
    onInteractionChange?.(false);
    if (pendingPanSyncRef.current) {
      onPanChange(pendingPanSyncRef.current);
      pendingPanSyncRef.current = null;
    }
    if (pendingZoomSyncRef.current !== null) {
      onZoomChange(pendingZoomSyncRef.current);
      pendingZoomSyncRef.current = null;
    }
  }, [onPanChange, onZoomChange, onInteractionChange, setCommentsOverlayVisibility]);

  // Main Render Loop (always uses latest elements and camera)
  const render = useCallback(() => {
    if (!canvasRef.current) return;
    const cam = cameraRef.current;
    renderScene(canvasRef.current, latestElementsRef.current, {
      theme,
      gridVisible,
      gridType,
      zoom: cam.zoom,
      pan: cam.pan,
      selectedElementIds,
      selectionBox: selectionBoxRef.current,
      remoteUsers,
      activeStyleMode: styleMode,
      activeSnapAnchor: activeSnapAnchorRef.current,
      candidateAnchors: candidateAnchorsRef.current,
    });
  }, [
    theme,
    gridVisible,
    gridType,
    selectedElementIds,
    remoteUsers,
    styleMode,
  ]);

  const renderRef = useRef(render);
  renderRef.current = render;

  const isRenderPendingRef = useRef(false);
  const requestRender = useCallback(() => {
    if (!isRenderPendingRef.current) {
      isRenderPendingRef.current = true;
      requestAnimationFrame(() => {
        isRenderPendingRef.current = false;
        renderRef.current?.();
      });
    }
  }, []);

  // Sync cameraRef with incoming props when updated externally (e.g. from toolbar/reset/fit)
  // Ignored while user is actively gesturing to prevent stutter/jitter
  useEffect(() => {
    if (isUserInteractingRef.current) return;
    if (
      cameraRef.current.pan.x !== pan.x ||
      cameraRef.current.pan.y !== pan.y
    ) {
      cameraRef.current.pan = { ...pan };
      requestRender();
    }
  }, [pan, requestRender]);

  useEffect(() => {
    if (isUserInteractingRef.current) return;
    if (cameraRef.current.zoom !== zoom) {
      cameraRef.current.zoom = zoom;
      requestRender();
    }
  }, [zoom, requestRender]);

  // Convert Client Window Coordinates to Canvas World Coordinates
  const clientToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      const cam = cameraRef.current;
      return {
        x: (rawX - cam.pan.x) / cam.zoom,
        y: (rawY - cam.pan.y) / cam.zoom,
      };
    },
    []
  );

  // Convert Canvas World Coordinates to Screen Coordinates
  const worldToClient = useCallback(
    (worldX: number, worldY: number): Point => {
      const cam = cameraRef.current;
      return {
        x: worldX * cam.zoom + cam.pan.x,
        y: worldY * cam.zoom + cam.pan.y,
      };
    },
    []
  );

  // High DPI Canvas Resizing & ResizeObserver
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;

      const targetW = Math.round(clientWidth * dpr);
      const targetH = Math.round(clientHeight * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${clientWidth}px`;
        canvas.style.height = `${clientHeight}px`;
      }

      // Re-render immediately so the canvas is never left blank!
      renderRef.current?.();
    };

    handleResize();

    const ro = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => ro.disconnect();
  }, []);

  // Keep latest elements updated, auto-fixing any broken 0-length arrows to valid 120px arrows
  useEffect(() => {
    if (isUserInteractingRef.current || dragStateRef.current.mode !== 'none') return;
    let hasZeroLengthFix = false;
    const sanitized = elements.map((el) => {
      if ((el.type === 'arrow' || el.type === 'line') && !el.isDeleted) {
        const pts = el.points || [];
        const p1 = pts[0] || { x: 0, y: 0 };
        const p2 = pts[pts.length - 1] || { x: el.width, y: el.height };
        if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 4) {
          hasZeroLengthFix = true;
          return {
            ...el,
            width: 120,
            height: 0,
            points: [
              { x: 0, y: 0 },
              { x: 120, y: 0 },
            ],
            updatedAt: Date.now(),
          };
        }
      }
      return el;
    });

    latestElementsRef.current = sanitized;
    if (hasZeroLengthFix) {
      onElementsChange(sanitized, false);
    }
  }, [elements, onElementsChange]);

  // Request frame whenever elements, selection, theme, grid, or render props update
  useEffect(() => {
    requestRender();
  }, [requestRender, render, elements]);

  // Non-passive wheel listener: Ctrl + Wheel to zoom towards mouse, Shift + Wheel to pan horizontally, or regular scroll to pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNonPassive = (e: WheelEvent) => {
      e.preventDefault();

      // Shield camera from incoming React props during wheel interaction and hide comments
      isUserInteractingRef.current = true;
      setCommentsOverlayVisibility(false);
      onInteractionChange?.(true);

      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
        flushCameraSync();
      }, 160);

      const cam = cameraRef.current;

      // Normalize delta values for different deltaMode (pixel vs line vs page)
      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.deltaMode === 1) {
        // Line mode (most non-trackpad mice): multiply by line height
        dx *= 24;
        dy *= 24;
      } else if (e.deltaMode === 2) {
        // Page mode (rare): multiply by page height
        dx *= 400;
        dy *= 400;
      }

      if (e.ctrlKey || e.metaKey) {
        // Zoom towards mouse pointer with smooth exponential factor matching Figma
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Smooth exponential factor matching Figma/tldraw
        const clampedDelta = Math.max(-100, Math.min(100, dy));
        const zoomFactor = Math.pow(0.999, clampedDelta);
        const newZoom = Math.min(5, Math.max(0.1, cam.zoom * zoomFactor));

        const newPanX = mouseX - (mouseX - cam.pan.x) * (newZoom / cam.zoom);
        const newPanY = mouseY - (mouseY - cam.pan.y) * (newZoom / cam.zoom);

        cam.zoom = newZoom;
        cam.pan = { x: newPanX, y: newPanY };
        requestRender();

        pendingZoomSyncRef.current = newZoom;
        pendingPanSyncRef.current = { x: newPanX, y: newPanY };
      } else if (e.shiftKey) {
        // Shift + scroll: horizontal pan
        // In Chrome/Edge on Windows, Shift+wheel generates deltaX; in Firefox/Mac it may be deltaY
        const scrollAmount = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        cam.pan.x -= scrollAmount;
        requestRender();

        pendingPanSyncRef.current = { ...cam.pan };
      } else {
        // Normal scroll: pan (with normalized deltas)
        cam.pan.x -= dx;
        cam.pan.y -= dy;
        requestRender();

        pendingPanSyncRef.current = { ...cam.pan };
      }
    };

    container.addEventListener('wheel', onWheelNonPassive, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNonPassive);
      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
    };
  }, [requestRender, flushCameraSync, setCommentsOverlayVisibility, onInteractionChange]);

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}

    const worldPoint = clientToWorld(e.clientX, e.clientY);
    const isMiddleClick = e.button === 1;
    const isSpacePan = isSpacePressed || activeTool === 'pan' || isMiddleClick || e.buttons === 4;

    if (isSpacePan) {
      isUserInteractingRef.current = true;
      setCommentsOverlayVisibility(false);
      onInteractionChange?.(true);
      panLastPosRef.current = { x: e.clientX, y: e.clientY };
      updateDragState({
        mode: 'panning',
        startPos: { x: e.clientX, y: e.clientY },
        lastPos: { x: e.clientX, y: e.clientY },
        activeHandle: null,
        createdElementId: null,
      });
      return;
    }

    if (e.button !== 0) return; // Only primary button
    isUserInteractingRef.current = true;

    // 1. Comment Tool: Drop a pin on canvas coordinates
    if (activeTool === 'comment') {
      if (canComment) {
        onDropCommentPin?.(worldPoint);
      }
      return;
    }

    // Enforce read-only inspection for Viewers
    if (isViewer) {
      const hit = [...elements].reverse().find((el) => !el.isDeleted && isPointInElement(worldPoint, el));
      if (hit) {
        onSelectElements([hit.id]);
      } else {
        onSelectElements([]);
      }
      return;
    }
    if (selectedElementIds.length > 0) {
      const selected = elements.filter((el) => selectedElementIds.includes(el.id) && !el.isDeleted);
      if (selected.length === 1 && (selected[0].type === 'arrow' || selected[0].type === 'line')) {
        const arrowEl = selected[0];
        const pts = arrowEl.points || [
          { x: 0, y: 0 },
          { x: arrowEl.width, y: arrowEl.height },
        ];
        const startPt = { x: arrowEl.x + pts[0].x, y: arrowEl.y + pts[0].y };
        const endPt = { x: arrowEl.x + pts[pts.length - 1].x, y: arrowEl.y + pts[pts.length - 1].y };
        const hitRadius = 12 / zoom;

        if (distance(worldPoint, startPt) <= hitRadius) {
          updateDragState({
            mode: 'resizing',
            startPos: worldPoint,
            lastPos: worldPoint,
            activeHandle: 'start',
            createdElementId: arrowEl.id,
            initialBounds: getElementBounds(arrowEl),
          });
          return;
        }

        if (distance(worldPoint, endPt) <= hitRadius) {
          updateDragState({
            mode: 'resizing',
            startPos: worldPoint,
            lastPos: worldPoint,
            activeHandle: 'end',
            createdElementId: arrowEl.id,
            initialBounds: getElementBounds(arrowEl),
          });
          return;
        }
      } else {
        const bounds = getGroupBounds(selected);
        if (bounds) {
          const handle = getHitResizeHandle(worldPoint, bounds, zoom);
          if (handle) {
            updateDragState({
              mode: 'resizing',
              startPos: worldPoint,
              lastPos: worldPoint,
              activeHandle: handle,
              createdElementId: null,
              initialBounds: bounds,
            });
            return;
          }
        }
      }
    }

    // 2. Eraser Tool: Click on element to delete
    if (activeTool === 'eraser') {
      const hit = [...elements].reverse().find((el) => !el.isDeleted && isPointInElement(worldPoint, el));
      if (hit) {
        onElementsChange(
          elements.filter((el) => el.id !== hit.id),
          true
        );
      }
      return;
    }

    // 3. Selection Tool: Hit test elements
    if (activeTool === 'selection') {
      const hit = [...elements].reverse().find((el) => !el.isDeleted && isPointInElement(worldPoint, el));

      if (hit) {
        const isAlreadySelected = selectedElementIds.includes(hit.id);
        const newSelectedIds = e.shiftKey
          ? isAlreadySelected
            ? selectedElementIds.filter((id) => id !== hit.id)
            : [...selectedElementIds, hit.id]
          : isAlreadySelected
          ? selectedElementIds
          : [hit.id];

        onSelectElements(newSelectedIds);

        // Record start positions for moving
        const startPositions = new Map<string, { x: number; y: number }>();
        elements.forEach((el) => {
          if (newSelectedIds.includes(el.id)) {
            startPositions.set(el.id, { x: el.x, y: el.y });
          }
        });

        updateDragState({
          mode: 'moving',
          startPos: worldPoint,
          lastPos: worldPoint,
          activeHandle: null,
          createdElementId: null,
          elementStartPositions: startPositions,
        });
      } else {
        // Clicked blank canvas: Start Box Selection
        if (!e.shiftKey) {
          onSelectElements([]);
        }
        updateDragState({
          mode: 'box-select',
          startPos: worldPoint,
          lastPos: worldPoint,
          activeHandle: null,
          createdElementId: null,
        });
        const initialBox = {
          minX: worldPoint.x,
          minY: worldPoint.y,
          maxX: worldPoint.x,
          maxY: worldPoint.y,
          width: 0,
          height: 0,
        };
        selectionBoxRef.current = initialBox;
        requestRender();
      }
      return;
    }

    // 4. Create new element (Shape, Arrow, Pen, Sticky, Text)
    const newId = `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const isConnector = activeTool === 'arrow' || activeTool === 'line';
    const nearestStartAnchor = isConnector ? findNearestShapeAnchor(worldPoint, elements, 40) : null;

    const initialPos = nearestStartAnchor
      ? { x: nearestStartAnchor.x, y: nearestStartAnchor.y }
      : gridSnap
      ? { x: snapToGrid(worldPoint.x), y: snapToGrid(worldPoint.y) }
      : worldPoint;

    const startBinding: ArrowBinding | undefined = nearestStartAnchor
      ? {
          elementId: nearestStartAnchor.elementId,
          focus: 0,
          anchorPosition: nearestStartAnchor.position,
        }
      : undefined;

    startBindingRef.current = startBinding;
    endBindingRef.current = undefined;
    activeSnapAnchorRef.current = nearestStartAnchor;

    let newElement: CanvasElement;

    if (activeTool === 'text') {
      newElement = {
        id: newId,
        type: 'text',
        x: initialPos.x,
        y: initialPos.y,
        width: 140,
        height: 36,
        angle: 0,
        strokeColor: currentStyle.strokeColor,
        backgroundColor: 'transparent',
        fillStyle: 'none',
        strokeWidth: currentStyle.strokeWidth,
        strokeStyle: currentStyle.strokeStyle,
        roughness: currentStyle.roughness,
        opacity: currentStyle.opacity,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        text: 'Type text...',
        fontSize: currentStyle.fontSize,
      };

      onElementsChange([...elements, newElement], true);
      onSelectElements([newId]);
      onToolChange('selection');

      // Open inline editor right away
      setEditingTextElement({
        elementId: newId,
        x: initialPos.x,
        y: initialPos.y,
        width: 140,
        height: 36,
        text: 'Type text...',
      });
      return;
    }

    if (activeTool === 'sticky') {
      newElement = {
        id: newId,
        type: 'sticky',
        x: initialPos.x,
        y: initialPos.y,
        width: 180,
        height: 140,
        angle: 0,
        strokeColor: '#f59e0b',
        backgroundColor: theme === 'dark' ? '#451a03' : '#fef3c7',
        fillStyle: 'solid',
        strokeWidth: 1.5,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 98,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        text: 'Sticky Note\n• Click to edit\n• Add sprint notes',
        textColor: currentStyle.textColor || (theme === 'dark' ? '#fde68a' : '#78350f'),
        fontSize: currentStyle.fontSize || 14,
      };

      onElementsChange([...elements, newElement], true);
      onSelectElements([newId]);
      onToolChange('selection');
      return;
    }

    if (activeTool === 'draw') {
      newElement = {
        id: newId,
        type: 'draw',
        x: initialPos.x,
        y: initialPos.y,
        width: 0,
        height: 0,
        angle: 0,
        strokeColor: currentStyle.strokeColor,
        backgroundColor: 'transparent',
        fillStyle: 'none',
        strokeWidth: currentStyle.strokeWidth,
        strokeStyle: 'solid',
        roughness: currentStyle.roughness,
        opacity: currentStyle.opacity,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        points: [{ x: 0, y: 0 }],
      };
    } else if (activeTool === 'arrow' || activeTool === 'line') {
      newElement = {
        id: newId,
        type: activeTool,
        x: initialPos.x,
        y: initialPos.y,
        width: 0,
        height: 0,
        angle: 0,
        strokeColor: currentStyle.strokeColor,
        backgroundColor: 'transparent',
        fillStyle: 'none',
        strokeWidth: currentStyle.strokeWidth,
        strokeStyle: currentStyle.strokeStyle,
        roughness: currentStyle.roughness,
        opacity: currentStyle.opacity,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        points: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        endArrowhead: activeTool === 'arrow' ? 'arrow' : 'none',
        startBinding: startBinding,
      };
    } else {
      // rectangle, diamond, ellipse
      newElement = {
        id: newId,
        type: activeTool,
        x: initialPos.x,
        y: initialPos.y,
        width: 0,
        height: 0,
        angle: 0,
        strokeColor: currentStyle.strokeColor,
        backgroundColor: currentStyle.backgroundColor,
        fillStyle: currentStyle.fillStyle,
        strokeWidth: currentStyle.strokeWidth,
        strokeStyle: currentStyle.strokeStyle,
        roughness: currentStyle.roughness,
        opacity: currentStyle.opacity,
        fillOpacity: currentStyle.fillOpacity,
        textColor: currentStyle.textColor || 'contrast',
        fontSize: currentStyle.fontSize || 16,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
      };
    }

    const nextElements = [...elements, newElement];
    latestElementsRef.current = nextElements;
    onElementsChange(nextElements, false);
    if (selectedElementIds.length > 0) {
      onSelectElements([]);
    }

    updateDragState({
      mode: 'drawing',
      startPos: initialPos,
      lastPos: initialPos,
      activeHandle: null,
      createdElementId: newId,
    });
  };

  const lastCursorEmitRef = useRef<number>(0);

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    const worldPoint = clientToWorld(e.clientX, e.clientY);
    const now = Date.now();
    if (now - lastCursorEmitRef.current > 33) {
      onCursorMove(worldPoint);
      lastCursorEmitRef.current = now;
    }

    const curDrag = dragStateRef.current;

    if (curDrag.mode === 'none') {
      if (activeTool === 'selection') {
        if (selectedElementIds.length > 0) {
          const selected = elements.filter((el) => selectedElementIds.includes(el.id) && !el.isDeleted);
          if (selected.length === 1 && (selected[0].type === 'arrow' || selected[0].type === 'line')) {
            const arrowEl = selected[0];
            const pts = arrowEl.points || [
              { x: 0, y: 0 },
              { x: arrowEl.width, y: arrowEl.height },
            ];
            const startPt = { x: arrowEl.x + pts[0].x, y: arrowEl.y + pts[0].y };
            const endPt = { x: arrowEl.x + pts[pts.length - 1].x, y: arrowEl.y + pts[pts.length - 1].y };
            const hitRadius = 12 / zoom;

            let handle: ResizeHandle | null = null;
            if (distance(worldPoint, startPt) <= hitRadius) {
              handle = 'start';
            } else if (distance(worldPoint, endPt) <= hitRadius) {
              handle = 'end';
            }
            if (hoveredHandleRef.current !== handle) {
              hoveredHandleRef.current = handle;
              updateCursor();
            }
          } else {
            const bounds = getGroupBounds(selected);
            const handle = bounds ? getHitResizeHandle(worldPoint, bounds, zoom) : null;
            if (hoveredHandleRef.current !== handle) {
              hoveredHandleRef.current = handle;
              updateCursor();
            }
          }
        } else if (hoveredHandleRef.current) {
          hoveredHandleRef.current = null;
          updateCursor();
        }
      }

      if (activeTool === 'arrow' || activeTool === 'line') {
        const candidateShapes = elements.filter(
          (el) => !el.isDeleted && el.type !== 'arrow' && el.type !== 'line' && el.type !== 'draw'
        );
        const nearbyShape = [...candidateShapes].reverse().find((target) => {
          const b = getElementBounds(target);
          return (
            worldPoint.x >= b.minX - 40 &&
            worldPoint.x <= b.maxX + 40 &&
            worldPoint.y >= b.minY - 40 &&
            worldPoint.y <= b.maxY + 40
          );
        });

        if (nearbyShape) {
          const nearest = findNearestShapeAnchor(worldPoint, [nearbyShape], 40);
          const anchors = getShapeAnchors(nearbyShape);
          candidateAnchorsRef.current = anchors;
          activeSnapAnchorRef.current = nearest || null;
          hoveredShapeIdRef.current = nearbyShape.id;
          currentSnapAnchorRef.current = nearest || null;
          requestRender();
        } else {
          if (hoveredShapeIdRef.current !== null || currentSnapAnchorRef.current !== null) {
            hoveredShapeIdRef.current = null;
            currentSnapAnchorRef.current = null;
            candidateAnchorsRef.current = [];
            activeSnapAnchorRef.current = null;
            requestRender();
          }
        }
      } else {
        if (hoveredShapeIdRef.current !== null || currentSnapAnchorRef.current !== null) {
          hoveredShapeIdRef.current = null;
          currentSnapAnchorRef.current = null;
          candidateAnchorsRef.current = [];
          activeSnapAnchorRef.current = null;
          requestRender();
        }
      }
      return;
    }

    if (curDrag.mode === 'panning') {
      const dx = e.clientX - panLastPosRef.current.x;
      const dy = e.clientY - panLastPosRef.current.y;
      panLastPosRef.current = { x: e.clientX, y: e.clientY };

      const cam = cameraRef.current;
      cam.pan.x += dx;
      cam.pan.y += dy;
      requestRender();

      pendingPanSyncRef.current = { ...cam.pan };
      return;
    }

    if (curDrag.mode === 'box-select') {
      const minX = Math.min(curDrag.startPos.x, worldPoint.x);
      const minY = Math.min(curDrag.startPos.y, worldPoint.y);
      const maxX = Math.max(curDrag.startPos.x, worldPoint.x);
      const maxY = Math.max(curDrag.startPos.y, worldPoint.y);

      const box = {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
      };

      selectionBoxRef.current = box;
      requestRender();

      // Select elements inside or intersecting box (Figma marquee selection)
      const selected = elements
        .filter((el) => {
          if (el.isDeleted) return false;
          const bounds = getElementBounds(el);
          return (
            bounds.minX <= maxX &&
            bounds.maxX >= minX &&
            bounds.minY <= maxY &&
            bounds.maxY >= minY
          );
        })
        .map((el) => el.id);

      if (
        selected.length !== selectedElementIds.length ||
        selected.some((id, i) => id !== selectedElementIds[i])
      ) {
        onSelectElements(selected);
      }
      return;
    }

    if (curDrag.mode === 'moving') {
      const dx = worldPoint.x - curDrag.startPos.x;
      const dy = worldPoint.y - curDrag.startPos.y;

      const finalDx = gridSnap ? snapToGrid(dx) : dx;
      const finalDy = gridSnap ? snapToGrid(dy) : dy;

      const moved = elements.map((el) => {
        if (selectedElementIds.includes(el.id)) {
          const start = curDrag.elementStartPositions?.get(el.id);
          if (start) {
            return {
              ...el,
              x: start.x + finalDx,
              y: start.y + finalDy,
              updatedAt: Date.now(),
            };
          }
        }
        return el;
      });

      // Dynamically update connectors anchored to any moving shapes!
      const updated = updateBoundArrows(moved, selectedElementIds);

      latestElementsRef.current = updated;
      requestRender();

      if (now - lastSocketEmitRef.current > 33) {
        lastSocketEmitRef.current = now;
        socketService.emitElementsChange(updated, false);
      }
      return;
    }

    if (curDrag.mode === 'drawing' && curDrag.createdElementId) {
      const currentElements = latestElementsRef.current;
      const el = currentElements.find((e) => e.id === curDrag.createdElementId);
      if (!el) return;

      let updated: CanvasElement[] = currentElements;

      if (el.type === 'draw') {
        const localPoint = {
          x: worldPoint.x - el.x,
          y: worldPoint.y - el.y,
        };
        const currentPoints = el.points || [];
        const lastPoint = currentPoints[currentPoints.length - 1];

        // Skip adding point if mouse movement is negligible (< 1.5px) to maintain smooth 60fps performance
        if (lastPoint && distance(lastPoint, localPoint) < 1.5) {
          return;
        }

        const updatedPoints = [...currentPoints, localPoint];
        const xs = updatedPoints.map((p) => p.x);
        const ys = updatedPoints.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        updated = currentElements.map((item) =>
          item.id === el.id
            ? {
                ...item,
                width: Math.max(1, maxX - minX),
                height: Math.max(1, maxY - minY),
                points: updatedPoints,
                updatedAt: Date.now(),
              }
            : item
        );
      } else if (el.type === 'arrow' || el.type === 'line') {
        const candidateElements = currentElements.filter(
          (e) => !e.isDeleted && e.id !== el.id && e.type !== 'arrow' && e.type !== 'line' && e.type !== 'draw'
        );

        // Find nearby candidate shape to display anchor points
        const nearbyShape = [...candidateElements].reverse().find((target) => {
          const b = getElementBounds(target);
          return (
            worldPoint.x >= b.minX - 40 &&
            worldPoint.x <= b.maxX + 40 &&
            worldPoint.y >= b.minY - 40 &&
            worldPoint.y <= b.maxY + 40
          );
        });

        const anchors = nearbyShape ? getShapeAnchors(nearbyShape) : [];
        const snapAnchor = findNearestShapeAnchor(worldPoint, candidateElements, 40);

        candidateAnchorsRef.current = anchors;
        activeSnapAnchorRef.current = snapAnchor;

        let targetX = snapAnchor ? snapAnchor.x : gridSnap ? snapToGrid(worldPoint.x) : worldPoint.x;
        let targetY = snapAnchor ? snapAnchor.y : gridSnap ? snapToGrid(worldPoint.y) : worldPoint.y;

        // Holding Shift snaps arrow / line to 15-degree angle increments (0°, 15°, 30°, 45°, 90°, etc.)
        if (e.shiftKey && !snapAnchor) {
          const dx = targetX - el.x;
          const dy = targetY - el.y;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const snapStep = Math.PI / 12; // 15°
          const snappedAngle = Math.round(angle / snapStep) * snapStep;
          targetX = el.x + dist * Math.cos(snappedAngle);
          targetY = el.y + dist * Math.sin(snappedAngle);
        }

        const endBinding: ArrowBinding | undefined = snapAnchor
          ? {
              elementId: snapAnchor.elementId,
              focus: 0,
              anchorPosition: snapAnchor.position,
            }
          : undefined;
        endBindingRef.current = endBinding;

        const p2 = { x: targetX - el.x, y: targetY - el.y };

        updated = currentElements.map((item) =>
          item.id === el.id
            ? {
                ...item,
                width: p2.x,
                height: p2.y,
                points: [{ x: 0, y: 0 }, p2],
                startBinding: startBindingRef.current,
                endBinding: endBinding,
                updatedAt: Date.now(),
              }
            : item
        );
      } else {
        const rawW = worldPoint.x - curDrag.startPos.x;
        const rawH = worldPoint.y - curDrag.startPos.y;
        let w = gridSnap ? snapToGrid(rawW) : rawW;
        let h = gridSnap ? snapToGrid(rawH) : rawH;

        // Holding Shift constrains rectangle to square (1:1), ellipse to circle, diamond to square diamond (Paint / Figma standard)
        if (e.shiftKey) {
          const side = Math.max(Math.abs(w), Math.abs(h));
          w = (w < 0 ? -1 : 1) * side;
          h = (h < 0 ? -1 : 1) * side;
        }

        const posX = w < 0 ? curDrag.startPos.x + w : curDrag.startPos.x;
        const posY = h < 0 ? curDrag.startPos.y + h : curDrag.startPos.y;

        updated = currentElements.map((item) =>
          item.id === el.id
            ? {
                ...item,
                x: posX,
                y: posY,
                width: Math.abs(w),
                height: Math.abs(h),
                updatedAt: Date.now(),
              }
            : item
        );
      }

      latestElementsRef.current = updated;
      requestRender();
      if (now - lastSocketEmitRef.current > 33) {
        lastSocketEmitRef.current = now;
        socketService.emitElementsChange(updated, false);
      }
      return;
    }

    if (curDrag.mode === 'resizing') {
      const handle = curDrag.activeHandle;
      if (!handle) return;

      if (handle === 'start' || handle === 'end') {
        const targetArrowId = curDrag.createdElementId || selectedElementIds[0];
        const targetArrow = latestElementsRef.current.find((item) => item.id === targetArrowId);
        if (!targetArrow) return;

        const candidateElements = latestElementsRef.current.filter(
          (e) => !e.isDeleted && e.id !== targetArrow.id && e.type !== 'arrow' && e.type !== 'line' && e.type !== 'draw'
        );

        // Find nearby candidate shape to display anchor points
        const nearbyShape = [...candidateElements].reverse().find((target) => {
          const b = getElementBounds(target);
          return (
            worldPoint.x >= b.minX - 40 &&
            worldPoint.x <= b.maxX + 40 &&
            worldPoint.y >= b.minY - 40 &&
            worldPoint.y <= b.maxY + 40
          );
        });

        const anchors = nearbyShape ? getShapeAnchors(nearbyShape) : [];
        const snapAnchor = findNearestShapeAnchor(worldPoint, candidateElements, 40);

        candidateAnchorsRef.current = anchors;
        activeSnapAnchorRef.current = snapAnchor;

        const targetX = snapAnchor ? snapAnchor.x : gridSnap ? snapToGrid(worldPoint.x) : worldPoint.x;
        const targetY = snapAnchor ? snapAnchor.y : gridSnap ? snapToGrid(worldPoint.y) : worldPoint.y;

        const pts = targetArrow.points || [
          { x: 0, y: 0 },
          { x: targetArrow.width, y: targetArrow.height },
        ];

        let newX = targetArrow.x;
        let newY = targetArrow.y;
        let newPoints = [...pts];
        let newStartBinding = targetArrow.startBinding;
        let newEndBinding = targetArrow.endBinding;

        if (handle === 'start') {
          const currentAbsEnd = {
            x: targetArrow.x + pts[pts.length - 1].x,
            y: targetArrow.y + pts[pts.length - 1].y,
          };
          newX = targetX;
          newY = targetY;
          newPoints[0] = { x: 0, y: 0 };
          newPoints[pts.length - 1] = {
            x: currentAbsEnd.x - newX,
            y: currentAbsEnd.y - newY,
          };
          newStartBinding = snapAnchor
            ? {
                elementId: snapAnchor.elementId,
                focus: 0,
                anchorPosition: snapAnchor.position,
              }
            : undefined;
        } else {
          // 'end' handle
          newPoints[pts.length - 1] = {
            x: targetX - newX,
            y: targetY - newY,
          };
          newEndBinding = snapAnchor
            ? {
                elementId: snapAnchor.elementId,
                focus: 0,
                anchorPosition: snapAnchor.position,
              }
            : undefined;
        }

        const updated = latestElementsRef.current.map((item) =>
          item.id === targetArrow.id
            ? {
                ...item,
                x: newX,
                y: newY,
                width: newPoints[newPoints.length - 1].x,
                height: newPoints[newPoints.length - 1].y,
                points: newPoints,
                startBinding: newStartBinding,
                endBinding: newEndBinding,
                updatedAt: Date.now(),
              }
            : item
        );

        latestElementsRef.current = updated;
        requestRender();
        if (now - lastSocketEmitRef.current > 33) {
          lastSocketEmitRef.current = now;
          socketService.emitElementsChange(updated, false);
        }
        return;
      }

      if (curDrag.initialBounds) {
        const init = curDrag.initialBounds;
        let newBounds = { ...init };

        if (handle.includes('e')) newBounds.width = Math.max(20, worldPoint.x - init.minX);
        if (handle.includes('s')) newBounds.height = Math.max(20, worldPoint.y - init.minY);
        if (handle.includes('w')) {
          const newW = Math.max(20, init.maxX - worldPoint.x);
          newBounds.minX = init.maxX - newW;
          newBounds.width = newW;
        }
        if (handle.includes('n')) {
          const newH = Math.max(20, init.maxY - worldPoint.y);
          newBounds.minY = init.maxY - newH;
          newBounds.height = newH;
        }

        // Shift key locks aspect ratio during corner resize (Paint / Figma standard)
        if (e.shiftKey && handle.length === 2) {
          const initRatio = init.width / Math.max(1, init.height);
          const currentRatio = newBounds.width / Math.max(1, newBounds.height);
          if (currentRatio > initRatio) {
            newBounds.width = newBounds.height * initRatio;
            if (handle.includes('w')) {
              newBounds.minX = init.maxX - newBounds.width;
            }
          } else {
            newBounds.height = newBounds.width / initRatio;
            if (handle.includes('n')) {
              newBounds.minY = init.maxY - newBounds.height;
            }
          }
        }

        // Update selected elements proportional to new bounding box
        const scaleX = newBounds.width / Math.max(1, init.width);
        const scaleY = newBounds.height / Math.max(1, init.height);

        const updated = elements.map((el) => {
          if (selectedElementIds.includes(el.id)) {
            const relX = (el.x - init.minX) * scaleX;
            const relY = (el.y - init.minY) * scaleY;
            const scaledPoints = el.points
              ? el.points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }))
              : undefined;
            return {
              ...el,
              x: newBounds.minX + relX,
              y: newBounds.minY + relY,
              width: Math.max(20, el.width * scaleX),
              height: Math.max(20, el.height * scaleY),
              points: scaledPoints,
              updatedAt: Date.now(),
            };
          }
          return el;
        });

        // Update any bound arrows anchored to the resized shapes
        const withBoundArrows = updateBoundArrows(updated, selectedElementIds);

        latestElementsRef.current = withBoundArrows;
        requestRender();
        if (now - lastSocketEmitRef.current > 33) {
          lastSocketEmitRef.current = now;
          socketService.emitElementsChange(withBoundArrows, false);
        }
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e?: React.PointerEvent) => {
    try {
      if (e) (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    isUserInteractingRef.current = false;
    candidateAnchorsRef.current = [];
    activeSnapAnchorRef.current = null;
    hoveredShapeIdRef.current = null;
    currentSnapAnchorRef.current = null;
    flushCameraSync();

    const curDrag = dragStateRef.current;

    if (curDrag.mode === 'drawing' || curDrag.mode === 'moving' || curDrag.mode === 'resizing') {
      let finalElements = latestElementsRef.current;
      if (curDrag.mode === 'moving' || curDrag.mode === 'resizing') {
        finalElements = updateBoundArrows(finalElements, selectedElementIds);
        latestElementsRef.current = finalElements;
      }

      // If user just clicked without dragging (dist < 6), create a clean default 120px arrow or line, or 100x100 shape
      if (curDrag.mode === 'drawing' && curDrag.createdElementId) {
        const createdEl = finalElements.find((item) => item.id === curDrag.createdElementId);
        if (createdEl) {
          if (createdEl.type === 'arrow' || createdEl.type === 'line') {
            const pts = createdEl.points || [];
            const p1 = pts[0] || { x: 0, y: 0 };
            const p2 = pts[pts.length - 1] || { x: createdEl.width, y: createdEl.height };
            if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 6) {
              const defaultLen = 120;
              finalElements = finalElements.map((item) =>
                item.id === createdEl.id
                  ? {
                      ...item,
                      width: defaultLen,
                      height: 0,
                      points: [
                        { x: 0, y: 0 },
                        { x: defaultLen, y: 0 },
                      ],
                      updatedAt: Date.now(),
                    }
                  : item
              );
              latestElementsRef.current = finalElements;
            }
          } else if (['rectangle', 'diamond', 'ellipse'].includes(createdEl.type)) {
            if (createdEl.width < 6 && createdEl.height < 6) {
              finalElements = finalElements.map((item) =>
                item.id === createdEl.id
                  ? {
                      ...item,
                      width: 100,
                      height: 100,
                      updatedAt: Date.now(),
                    }
                  : item
              );
              latestElementsRef.current = finalElements;
            }
          }
        }
      }

      // Commit once to React state & history on drag completion
      onElementsChange(finalElements, true);

      // Force immediate socket broadcast for final position
      socketService.emitElementsChange(finalElements, true);

      if (curDrag.mode === 'drawing' && curDrag.createdElementId) {
        if (activeTool !== 'draw') {
          onSelectElements([curDrag.createdElementId]);
          onToolChange('selection');
        }
      }
    }

    startBindingRef.current = undefined;
    endBindingRef.current = undefined;

    updateDragState({
      mode: 'none',
      startPos: { x: 0, y: 0 },
      lastPos: { x: 0, y: 0 },
      activeHandle: null,
      createdElementId: null,
    });
    selectionBoxRef.current = null;
    requestRender();
  };

  // Double click on element: Open inline text editor
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isViewer) return;
    const worldPoint = clientToWorld(e.clientX, e.clientY);
    const hit = [...elements].reverse().find((el) => !el.isDeleted && isPointInElement(worldPoint, el));

    if (hit) {
      onSelectElements([hit.id]);
      setEditingTextElement({
        elementId: hit.id,
        x: hit.x,
        y: hit.y,
        width: hit.width,
        height: hit.height,
        text: hit.text || '',
        textColor: hit.textColor || (currentStyle as any).textColor || 'contrast',
        fontSize: hit.fontSize || currentStyle.fontSize || 14,
      });
    } else if (activeTool === 'selection' || activeTool === 'text') {
      const textColor = (currentStyle as any).textColor || 'contrast';
      const newEl: CanvasElement = {
        id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'text',
        x: worldPoint.x,
        y: worldPoint.y,
        width: 140,
        height: 36,
        angle: 0,
        strokeColor: currentStyle.strokeColor,
        backgroundColor: 'transparent',
        textColor: textColor,
        fillStyle: 'none',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        text: '',
        fontSize: currentStyle.fontSize || 18,
      };
      onElementsChange([...elements, newEl], true);
      onSelectElements([newEl.id]);
      setEditingTextElement({
        elementId: newEl.id,
        x: newEl.x,
        y: newEl.y,
        width: newEl.width,
        height: newEl.height,
        text: '',
        textColor: textColor,
        fontSize: newEl.fontSize,
      });
    }
  };

  // Save edited text
  const handleFinishEditingText = (newText: string) => {
    if (editingTextElement) {
      onElementsChange(
        elements.map((el) =>
          el.id === editingTextElement.elementId
            ? {
                ...el,
                text: newText,
                textColor: el.textColor || editingTextElement.textColor || (currentStyle as any).textColor,
                fontSize: el.fontSize || editingTextElement.fontSize || currentStyle.fontSize || 14,
                updatedAt: Date.now(),
              }
            : el
        ),
        true
      );
      setEditingTextElement(null);
    }
  };

  // Dynamic Cursor Style
  function getCursor() {
    return getFigmaCursor(
      activeTool,
      dragState.mode,
      isSpacePressed,
      dragState.activeHandle || hoveredHandleRef.current
    );
  }

  function updateCursor() {
    if (containerRef.current) {
      containerRef.current.style.cursor = getCursor();
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: getCursor(),
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* Inline Text Editor Overlay */}
      {editingTextElement && (() => {
        const targetElement = elements.find((e) => e.id === editingTextElement.elementId);
        const effectiveTextColor = getEffectiveTextColor(
          editingTextElement.textColor,
          targetElement || {
            x: editingTextElement.x,
            y: editingTextElement.y,
            width: editingTextElement.width,
            height: editingTextElement.height,
            type: 'text',
          },
          theme === 'dark',
          elements
        );

        return (
          <textarea
            autoFocus
            value={editingTextElement.text}
            onChange={(e) =>
              setEditingTextElement((prev) => (prev ? { ...prev, text: e.target.value } : null))
            }
            onBlur={() => handleFinishEditingText(editingTextElement.text)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
                handleFinishEditingText(editingTextElement.text);
              }
            }}
            style={{
              position: 'absolute',
              left: `${worldToClient(editingTextElement.x, editingTextElement.y).x}px`,
              top: `${worldToClient(editingTextElement.x, editingTextElement.y).y}px`,
              width: `${Math.max(120, editingTextElement.width * zoom)}px`,
              height: `${Math.max(60, editingTextElement.height * zoom)}px`,
              transformOrigin: 'top left',
              background: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              color: effectiveTextColor,
              border: '2px solid #6366f1',
              borderRadius: 6,
              padding: 8,
              fontFamily:
                targetElement?.type === 'sticky'
                  ? "'Lobster Two', cursive, sans-serif"
                  : "'Teachers', 'Inter', sans-serif",
              fontSize: `${(editingTextElement.fontSize || 14) * zoom}px`,
              resize: 'both',
              zIndex: 100,
              outline: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          />
        );
      })()}

      {/* Neumorphic Hand Tool Active Indicator with GSAP Spring Entrance */}
      {(isSpacePressed || activeTool === 'pan') && (
        <HandToolPill isSpacePressed={isSpacePressed} theme={theme} />
      )}
    </div>
  );
}

export const Canvas = React.memo(CanvasComponent);
