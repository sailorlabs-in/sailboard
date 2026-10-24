/**
 * Figma-style custom vector cursors for Sailboard
 * All cursors are 28x28 SVGs with crisp dual-outlines (dark fill, white stroke, soft drop-shadow)
 * to guarantee optimal visibility across both dark and light canvases.
 */

import { ElementType } from '@rea/shared-types';

function createSvgCursor(svg: string, hotspotX: number, hotspotY: number, fallback = 'crosshair'): string {
  const cleanSvg = svg.replace(/\s+/g, ' ').trim();
  return `url("data:image/svg+xml,${encodeURIComponent(cleanSvg)}") ${hotspotX} ${hotspotY}, ${fallback}`;
}

// 1. Comment Pin Cursor (Hotspot: 3, 21 at the speech bubble tail)
const COMMENT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <path d="M4 22L7 17H19C21.2 17 23 15.2 23 13V6C23 3.8 21.2 2 19 2H7C4.8 2 3 3.8 3 6V16C3 17 3.3 18 4 19L4 22Z" fill="rgba(0,0,0,0.35)"/>
  <path d="M3 21L6 16H18C20.2 16 22 14.2 22 12V5C22 2.8 20.2 1 18 1H6C3.8 1 2 2.8 2 5V15C2 16 2.3 17 3 18L3 21Z" fill="#ffffff"/>
  <path d="M4 20L6.6 15.5H17C18.7 15.5 20.5 13.8 20.5 12V5.5C20.5 3.8 18.7 2.5 17 2.5H6.5C4.8 2.5 3.5 3.8 3.5 5.5V14.5L4 20Z" fill="#6366f1"/>
  <circle cx="8" cy="9" r="1.3" fill="#ffffff"/>
  <circle cx="12" cy="9" r="1.3" fill="#ffffff"/>
  <circle cx="16" cy="9" r="1.3" fill="#ffffff"/>
  <circle cx="3" cy="21" r="1" fill="#ffffff"/>
</svg>
`;

// 2. Freehand Pen Cursor (Hotspot: 2, 22 at the pen tip)
const PEN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <path d="M3 23L7 22L21 8C22.1 6.9 22.1 5.1 21 4L20 3C18.9 1.9 17.1 1.9 16 3L2 17L1 21L3 23Z" fill="rgba(0,0,0,0.35)"/>
  <path d="M2 22L6 21L20 7C21.1 5.9 21.1 4.1 20 3L19 2C17.9 0.9 16.1 0.9 15 2L1 16L0 20L2 22Z" fill="#ffffff"/>
  <path d="M3 21L6 20.5L19 7.5L16.5 5L3.5 18L3 21Z" fill="#1e293b"/>
  <path d="M16.5 5L19 7.5L19.5 7C20.3 6.2 20.3 5 19.5 4.2L18.8 3.5C18 2.7 16.8 2.7 16 3.5L15.5 4L16.5 5Z" fill="#6366f1"/>
  <path d="M2.5 21.5L4 18.5L5.5 20L2.5 21.5Z" fill="#cbd5e1"/>
  <circle cx="2" cy="22" r="1.2" fill="#0f172a"/>
  <circle cx="2" cy="22" r="0.6" fill="#6366f1"/>
</svg>
`;

// 3. Eraser Cursor (Hotspot: 3, 21 at the eraser bottom contact edge)
const ERASER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <path d="M5 22L1 18L13 6L21 14L12 23L5 22Z" fill="rgba(0,0,0,0.3)"/>
  <path d="M4 21L0.5 17.5C-0.2 16.8 -0.2 15.7 0.5 15L11.5 4C12.2 3.3 13.3 3.3 14 4L20.5 10.5C21.2 11.2 21.2 12.3 20.5 13L12 21.5C11.3 22.2 10.2 22.2 9.5 21.5L4 21Z" fill="#ffffff"/>
  <path d="M4 20.5L1.5 17.5C1.1 17.1 1.1 16.4 1.5 16L7 10.5L11.5 15L6.5 20L4 20.5Z" fill="#f43f5e"/>
  <path d="M7 10.5L12.5 5C12.9 4.6 13.6 4.6 14 5L18.5 9.5C18.9 9.9 18.9 10.6 18.5 11L13 16.5L11.5 15L7 10.5Z" fill="#3b82f6"/>
  <line x1="7" y1="10.5" x2="13" y2="16.5" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="3" cy="20.5" r="1.2" fill="#0f172a"/>
</svg>
`;

// 4. Text Tool Cursor (Hotspot: 4, 4 at the precision crosshair origin)
const TEXT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <line x1="1" y1="4" x2="7" y2="4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="1" y1="4" x2="7" y2="4" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>

  <rect x="9" y="9" width="16" height="16" rx="4" fill="rgba(0,0,0,0.3)"/>
  <rect x="8" y="8" width="16" height="16" rx="4" fill="#ffffff"/>
  <rect x="9" y="9" width="14" height="14" rx="3" fill="#6366f1"/>
  <path d="M12.5 12.5H19.5M16 12.5V19.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 5. Sticky Note Cursor (Hotspot: 4, 4 at crosshair origin)
const STICKY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <line x1="1" y1="4" x2="7" y2="4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="1" y1="4" x2="7" y2="4" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>

  <path d="M9 9H23V19L19 23H9V9Z" fill="rgba(0,0,0,0.3)"/>
  <path d="M8 8H22V18L18 22H8V8Z" fill="#ffffff"/>
  <path d="M9 9H21V17L17 21H9V9Z" fill="#facc15"/>
  <path d="M17 17H21L17 21V17Z" fill="#ca8a04"/>
  <line x1="11" y1="12" x2="17" y2="12" stroke="#a16207" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="11" y1="15" x2="18" y2="15" stroke="#a16207" stroke-width="1.2" stroke-linecap="round"/>
</svg>
`;

// 6. Rectangle Cursor (Hotspot: 4, 4 at crosshair origin)
const RECTANGLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <line x1="1" y1="4" x2="7" y2="4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="1" y1="4" x2="7" y2="4" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>

  <rect x="9" y="9" width="16" height="16" rx="4" fill="rgba(0,0,0,0.3)"/>
  <rect x="8" y="8" width="16" height="16" rx="4" fill="#ffffff"/>
  <rect x="9" y="9" width="14" height="14" rx="3" fill="#6366f1"/>
  <rect x="11.5" y="12" width="9" height="8" rx="1.5" stroke="#ffffff" stroke-width="1.6" fill="none"/>
</svg>
`;

// 7. Diamond Cursor (Hotspot: 4, 4 at crosshair origin)
const DIAMOND_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <line x1="1" y1="4" x2="7" y2="4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="1" y1="4" x2="7" y2="4" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>

  <rect x="9" y="9" width="16" height="16" rx="4" fill="rgba(0,0,0,0.3)"/>
  <rect x="8" y="8" width="16" height="16" rx="4" fill="#ffffff"/>
  <rect x="9" y="9" width="14" height="14" rx="3" fill="#6366f1"/>
  <path d="M16 11.5L20.5 16L16 20.5L11.5 16Z" stroke="#ffffff" stroke-width="1.6" fill="none"/>
</svg>
`;

// 8. Ellipse / Circle Cursor (Hotspot: 4, 4 at crosshair origin)
const ELLIPSE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <line x1="1" y1="4" x2="7" y2="4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="1" y1="4" x2="7" y2="4" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>

  <rect x="9" y="9" width="16" height="16" rx="4" fill="rgba(0,0,0,0.3)"/>
  <rect x="8" y="8" width="16" height="16" rx="4" fill="#ffffff"/>
  <rect x="9" y="9" width="14" height="14" rx="3" fill="#6366f1"/>
  <circle cx="16" cy="16" r="4.5" stroke="#ffffff" stroke-width="1.6" fill="none"/>
</svg>
`;

// 9. Arrow Connector Cursor (Hotspot: 4, 4 at crosshair origin)
const ARROW_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <line x1="1" y1="4" x2="7" y2="4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="1" y1="4" x2="7" y2="4" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>

  <rect x="9" y="9" width="16" height="16" rx="4" fill="rgba(0,0,0,0.3)"/>
  <rect x="8" y="8" width="16" height="16" rx="4" fill="#ffffff"/>
  <rect x="9" y="9" width="14" height="14" rx="3" fill="#6366f1"/>
  <path d="M12 20L20 12M20 12H15M20 12V17" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 10. Straight Line Cursor (Hotspot: 4, 4 at crosshair origin)
const LINE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <line x1="1" y1="4" x2="7" y2="4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="1" y1="4" x2="7" y2="4" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="4" y1="1" x2="4" y2="7" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>

  <rect x="9" y="9" width="16" height="16" rx="4" fill="rgba(0,0,0,0.3)"/>
  <rect x="8" y="8" width="16" height="16" rx="4" fill="#ffffff"/>
  <rect x="9" y="9" width="14" height="14" rx="3" fill="#6366f1"/>
  <line x1="12" y1="20" x2="20" y2="12" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
</svg>
`;

// Pre-computed data URI cursor strings
export const FIGMA_CURSORS = {
  comment: createSvgCursor(COMMENT_SVG, 3, 21),
  draw: createSvgCursor(PEN_SVG, 2, 22),
  eraser: createSvgCursor(ERASER_SVG, 3, 21),
  text: createSvgCursor(TEXT_SVG, 4, 4, 'text'),
  sticky: createSvgCursor(STICKY_SVG, 4, 4),
  rectangle: createSvgCursor(RECTANGLE_SVG, 4, 4),
  diamond: createSvgCursor(DIAMOND_SVG, 4, 4),
  ellipse: createSvgCursor(ELLIPSE_SVG, 4, 4),
  arrow: createSvgCursor(ARROW_SVG, 4, 4),
  line: createSvgCursor(LINE_SVG, 4, 4),
} as const;

/**
 * Resolves the Figma-style CSS cursor for the current canvas tool and drag state.
 */
export function getFigmaCursor(
  tool: ElementType | 'eraser' | 'pan' | 'comment',
  dragMode: string,
  isSpacePressed: boolean,
  activeHandle: string | null = null,
  isHoveringElement = false
): string {
  // Actively drawing state (arrow, line, rectangle, etc.)
  if (dragMode === 'drawing') return 'crosshair';

  // Panning state
  if (dragMode === 'panning') return 'grabbing';
  if (tool === 'pan' || isSpacePressed) return 'grab';

  // Selection tool
  if (tool === 'selection') {
    if (activeHandle) {
      if (activeHandle === 'rotation') return 'grab';
      if (['nw', 'se'].includes(activeHandle)) return 'nwse-resize';
      if (['ne', 'sw'].includes(activeHandle)) return 'nesw-resize';
      if (['e', 'w'].includes(activeHandle)) return 'ew-resize';
      if (['n', 's'].includes(activeHandle)) return 'ns-resize';
      if (activeHandle === 'start' || activeHandle === 'end') return 'crosshair';
    }
    if (dragMode === 'moving') return 'grabbing';
    if (isHoveringElement) return 'move';
    return 'default';
  }

  // Tool specific cursors (precision crosshair for arrow and line matching Figma)
  switch (tool) {
    case 'comment':
      return FIGMA_CURSORS.comment;
    case 'draw':
      return FIGMA_CURSORS.draw;
    case 'eraser':
      return FIGMA_CURSORS.eraser;
    case 'text':
      return FIGMA_CURSORS.text;
    case 'sticky':
      return FIGMA_CURSORS.sticky;
    case 'rectangle':
      return FIGMA_CURSORS.rectangle;
    case 'diamond':
      return FIGMA_CURSORS.diamond;
    case 'ellipse':
      return FIGMA_CURSORS.ellipse;
    case 'arrow':
      return 'crosshair';
    case 'line':
      return 'crosshair';
    default:
      return 'crosshair';
  }
}
