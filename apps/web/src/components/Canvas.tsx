import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasElement, ElementType, Point, UserPresence } from '@rea/shared-types';
import {
  getElementBounds,
  getGroupBounds,
  getHitResizeHandle,
  isPointInElement,
  ResizeHandle,
  snapToGrid,
  BoundingBox,
} from '../canvas/math';
import { renderScene } from '../canvas/renderer';
import { socketService } from '../services/socket';
import gsap from 'gsap';

// Animated spring pill indicator for Hand tool
const HandToolPill: React.FC<{ isSpacePressed: boolean; theme: 'light' | 'dark' }> = ({ isSpacePressed, theme }) => {
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
};

interface CanvasProps {
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[], recordHistory?: boolean) => void;
  selectedElementIds: string[];
  onSelectElements: (ids: string[]) => void;
  activeTool: ElementType | 'eraser' | 'pan';
  onToolChange: (tool: ElementType | 'eraser' | 'pan') => void;
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
    fillStyle: 'none' | 'solid' | 'hachure' | 'cross-hatch';
    strokeWidth: number;
    strokeStyle: 'solid' | 'dashed' | 'dotted';
    roughness: number;
    opacity: number;
    fontSize: number;
  };
  remoteUsers: UserPresence[];
  onCursorMove: (point: Point) => void;
  isViewer?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  onElementsChange,
  selectedElementIds,
  onSelectElements,
  activeTool,
  onToolChange,
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction State
  const [dragState, setDragState] = useState<{
    mode: 'none' | 'drawing' | 'moving' | 'resizing' | 'box-select' | 'panning';
    startPos: Point;
    lastPos: Point;
    activeHandle: ResizeHandle | null;
    createdElementId: string | null;
    initialBounds?: BoundingBox;
    elementStartPositions?: Map<string, { x: number; y: number }>;
  }>({
    mode: 'none',
    startPos: { x: 0, y: 0 },
    lastPos: { x: 0, y: 0 },
    activeHandle: null,
    createdElementId: null,
  });

  const [selectionBox, setSelectionBox] = useState<BoundingBox | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const previousToolRef = useRef<ElementType | 'eraser' | 'pan'>('selection');

  const latestElementsRef = useRef(elements);
  latestElementsRef.current = elements;

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
  } | null>(null);

  // Convert Client Window Coordinates to Canvas World Coordinates
  const clientToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      return {
        x: (rawX - pan.x) / zoom,
        y: (rawY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Convert Canvas World Coordinates to Screen Coordinates
  const worldToClient = useCallback(
    (worldX: number, worldY: number): Point => {
      return {
        x: worldX * zoom + pan.x,
        y: worldY * zoom + pan.y,
      };
    },
    [pan, zoom]
  );

  // Main Render Loop (always uses latest elements and state)
  const render = useCallback(() => {
    if (!canvasRef.current) return;
    renderScene(canvasRef.current, latestElementsRef.current, {
      theme,
      gridVisible,
      gridType,
      zoom,
      pan,
      selectedElementIds,
      selectionBox,
      remoteUsers,
      activeStyleMode: styleMode,
    });
  }, [theme, gridVisible, gridType, zoom, pan, selectedElementIds, selectionBox, remoteUsers, styleMode]);

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

  useEffect(() => {
    render();
  }, [render, elements]);

  // Non-passive wheel listener: Ctrl + Wheel to zoom towards mouse, or regular scroll to pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNonPassive = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom towards mouse pointer
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newZoom = Math.min(3, Math.max(0.2, zoom * zoomFactor));

        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        onZoomChange(newZoom);
        onPanChange({ x: newPanX, y: newPanY });
      } else {
        // Pan
        onPanChange({
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY,
        });
      }
    };

    container.addEventListener('wheel', onWheelNonPassive, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNonPassive);
    };
  }, [zoom, pan, onZoomChange, onPanChange]);

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    const worldPoint = clientToWorld(e.clientX, e.clientY);
    const isMiddleClick = e.button === 1;
    const isSpacePan = isSpacePressed || activeTool === 'pan' || isMiddleClick || e.buttons === 4;

    if (isSpacePan) {
      setDragState({
        mode: 'panning',
        startPos: { x: e.clientX, y: e.clientY },
        lastPos: { x: e.clientX, y: e.clientY },
        activeHandle: null,
        createdElementId: null,
      });
      return;
    }

    if (e.button !== 0) return; // Only primary button

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
      const bounds = getGroupBounds(selected);
      if (bounds) {
        const handle = getHitResizeHandle(worldPoint, bounds, zoom);
        if (handle) {
          setDragState({
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

    // 2. Eraser Tool: Click on element to delete
    if (activeTool === 'eraser') {
      const hit = [...elements].reverse().find((el) => !el.isDeleted && isPointInElement(worldPoint, el));
      if (hit) {
        onElementsChange(
          elements.map((el) => (el.id === hit.id ? { ...el, isDeleted: true } : el)),
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

        setDragState({
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
        setDragState({
          mode: 'box-select',
          startPos: worldPoint,
          lastPos: worldPoint,
          activeHandle: null,
          createdElementId: null,
        });
        setSelectionBox({
          minX: worldPoint.x,
          minY: worldPoint.y,
          maxX: worldPoint.x,
          maxY: worldPoint.y,
          width: 0,
          height: 0,
        });
      }
      return;
    }

    // 4. Create new element (Shape, Arrow, Pen, Sticky, Text)
    const newId = `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const initialPos = gridSnap
      ? { x: snapToGrid(worldPoint.x), y: snapToGrid(worldPoint.y) }
      : worldPoint;

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
        fontSize: 14,
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
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
      };
    }

    onElementsChange([...elements, newElement], false);
    onSelectElements([newId]);

    setDragState({
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
    if (now - lastCursorEmitRef.current > 20) {
      onCursorMove(worldPoint);
      lastCursorEmitRef.current = now;
    }

    if (dragState.mode === 'none') return;

    if (dragState.mode === 'panning') {
      const dx = e.clientX - dragState.lastPos.x;
      const dy = e.clientY - dragState.lastPos.y;
      onPanChange({ x: pan.x + dx, y: pan.y + dy });
      setDragState((prev) => ({ ...prev, lastPos: { x: e.clientX, y: e.clientY } }));
      return;
    }

    if (dragState.mode === 'box-select') {
      const minX = Math.min(dragState.startPos.x, worldPoint.x);
      const minY = Math.min(dragState.startPos.y, worldPoint.y);
      const maxX = Math.max(dragState.startPos.x, worldPoint.x);
      const maxY = Math.max(dragState.startPos.y, worldPoint.y);

      setSelectionBox({
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
      });

      // Select elements inside box
      const selected = elements
        .filter((el) => {
          if (el.isDeleted) return false;
          const bounds = getElementBounds(el);
          return (
            bounds.minX >= minX &&
            bounds.maxX <= maxX &&
            bounds.minY >= minY &&
            bounds.maxY <= maxY
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

    if (dragState.mode === 'moving') {
      const dx = worldPoint.x - dragState.startPos.x;
      const dy = worldPoint.y - dragState.startPos.y;

      const finalDx = gridSnap ? snapToGrid(dx) : dx;
      const finalDy = gridSnap ? snapToGrid(dy) : dy;

      const updated = elements.map((el) => {
        if (selectedElementIds.includes(el.id)) {
          const start = dragState.elementStartPositions?.get(el.id);
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

      latestElementsRef.current = updated;
      requestRender();
      socketService.emitElementsChange(updated, false);
      return;
    }

    if (dragState.mode === 'drawing' && dragState.createdElementId) {
      const el = elements.find((e) => e.id === dragState.createdElementId);
      if (!el) return;

      let updated: CanvasElement[] = elements;

      if (el.type === 'draw') {
        const localPoint = {
          x: worldPoint.x - el.x,
          y: worldPoint.y - el.y,
        };
        const updatedPoints = [...(el.points || []), localPoint];
        updated = elements.map((item) =>
          item.id === el.id
            ? {
                ...item,
                points: updatedPoints,
                updatedAt: Date.now(),
              }
            : item
        );
      } else if (el.type === 'arrow' || el.type === 'line') {
        const targetX = gridSnap ? snapToGrid(worldPoint.x) : worldPoint.x;
        const targetY = gridSnap ? snapToGrid(worldPoint.y) : worldPoint.y;
        const p2 = { x: targetX - el.x, y: targetY - el.y };

        updated = elements.map((item) =>
          item.id === el.id
            ? {
                ...item,
                width: p2.x,
                height: p2.y,
                points: [{ x: 0, y: 0 }, p2],
                updatedAt: Date.now(),
              }
            : item
        );
      } else {
        const rawW = worldPoint.x - dragState.startPos.x;
        const rawH = worldPoint.y - dragState.startPos.y;
        const w = gridSnap ? snapToGrid(rawW) : rawW;
        const h = gridSnap ? snapToGrid(rawH) : rawH;

        const posX = w < 0 ? dragState.startPos.x + w : dragState.startPos.x;
        const posY = h < 0 ? dragState.startPos.y + h : dragState.startPos.y;

        updated = elements.map((item) =>
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
      socketService.emitElementsChange(updated, false);
      return;
    }

    if (dragState.mode === 'resizing' && dragState.initialBounds) {
      const handle = dragState.activeHandle;
      if (!handle) return;

      const init = dragState.initialBounds;
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

      // Update selected elements proportional to new bounding box
      const scaleX = newBounds.width / Math.max(1, init.width);
      const scaleY = newBounds.height / Math.max(1, init.height);

      const updated = elements.map((el) => {
        if (selectedElementIds.includes(el.id)) {
          const relX = (el.x - init.minX) * scaleX;
          const relY = (el.y - init.minY) * scaleY;
          return {
            ...el,
            x: newBounds.minX + relX,
            y: newBounds.minY + relY,
            width: Math.max(20, el.width * scaleX),
            height: Math.max(20, el.height * scaleY),
            updatedAt: Date.now(),
          };
        }
        return el;
      });

      latestElementsRef.current = updated;
      requestRender();
      socketService.emitElementsChange(updated, false);
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    if (dragState.mode === 'drawing' || dragState.mode === 'moving' || dragState.mode === 'resizing') {
      // Commit once to React state & history on drag completion
      onElementsChange(latestElementsRef.current, true);

      // Force immediate socket broadcast for final position
      socketService.emitElementsChange(latestElementsRef.current, true);

      if (dragState.mode === 'drawing') {
        onToolChange('selection');
      }
    }

    setDragState({
      mode: 'none',
      startPos: { x: 0, y: 0 },
      lastPos: { x: 0, y: 0 },
      activeHandle: null,
      createdElementId: null,
    });
    setSelectionBox(null);
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
        textColor: hit.textColor,
      });
    } else if (activeTool === 'selection' || activeTool === 'text') {
      const textColor = (currentStyle as any).textColor || (theme === 'dark' ? '#f8fafc' : '#0f172a');
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
  const getCursor = () => {
    if (dragState.mode === 'panning') return 'grabbing';
    if (activeTool === 'pan' || isSpacePressed) return 'grab';
    if (activeTool === 'eraser') return 'crosshair';
    if (activeTool === 'selection') {
      if (dragState.activeHandle) {
        if (['nw', 'se'].includes(dragState.activeHandle)) return 'nwse-resize';
        if (['ne', 'sw'].includes(dragState.activeHandle)) return 'nesw-resize';
        if (['e', 'w'].includes(dragState.activeHandle)) return 'ew-resize';
        if (['n', 's'].includes(dragState.activeHandle)) return 'ns-resize';
      }
      return 'default';
    }
    return 'crosshair';
  };

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
      {editingTextElement && (
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
            color: editingTextElement.textColor || (theme === 'dark' ? '#f8fafc' : '#0f172a'),
            border: '2px solid #6366f1',
            borderRadius: 6,
            padding: 8,
            fontFamily: "'Inter', sans-serif",
            fontSize: `${14 * zoom}px`,
            resize: 'both',
            zIndex: 100,
            outline: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        />
      )}

      {/* Neumorphic Hand Tool Active Indicator with GSAP Spring Entrance */}
      {(isSpacePressed || activeTool === 'pan') && (
        <HandToolPill isSpacePressed={isSpacePressed} theme={theme} />
      )}
    </div>
  );
};
