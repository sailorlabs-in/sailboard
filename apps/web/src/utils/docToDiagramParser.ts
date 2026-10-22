import { CanvasElement, ElementType, ArrowBinding } from '@rea/shared-types';
import { getElementBounds } from '../canvas/math';

export type DiagramLayoutType = 'architecture' | 'mindmap' | 'sequence' | 'grid';
export type DiagramPalette = 'indigo' | 'emerald' | 'amber' | 'cyan' | 'slate';
export type DiagramPlacement = 'below' | 'right' | 'replace';

export interface ParsedConnection {
  from: string;
  to: string;
  label?: string;
}

export interface ParsedNode {
  id: string;
  text: string;
  category?: string;
  level: number;
  shapeType?: ElementType;
  color?: string;
}

export interface GenerateDiagramOptions {
  layout: DiagramLayoutType;
  palette: DiagramPalette;
  placement: DiagramPlacement;
  styleMode: 'rough' | 'clean';
  existingElements: CanvasElement[];
}

// Color palettes for semantic node tagging
const PALETTES: Record<DiagramPalette, { stroke: string; fill: string; text: string }> = {
  indigo: { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.12)', text: '#6366f1' },
  emerald: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)', text: '#10b981' },
  amber: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' },
  cyan: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.12)', text: '#06b6d4' },
  slate: { stroke: '#64748b', fill: 'rgba(100, 116, 139, 0.12)', text: '#64748b' },
};

/**
 * Detects component archetype based on naming (Eraser.io / Architecture convention)
 */
function getArchetype(text: string, defaultPalette: DiagramPalette) {
  const lower = text.toLowerCase();
  if (lower.includes('database') || lower.includes('db') || lower.includes('postgres') || lower.includes('mongo') || lower.includes('storage') || lower.includes('s3')) {
    return { shape: 'rectangle' as ElementType, stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.14)', badge: '💾' };
  }
  if (lower.includes('cache') || lower.includes('redis') || lower.includes('memcached')) {
    return { shape: 'ellipse' as ElementType, stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.14)', badge: '⚡' };
  }
  if (lower.includes('gateway') || lower.includes('router') || lower.includes('proxy') || lower.includes('decision') || lower.includes('verify')) {
    return { shape: 'diamond' as ElementType, stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.14)', badge: '🔀' };
  }
  if (lower.includes('auth') || lower.includes('token') || lower.includes('jwt') || lower.includes('security')) {
    return { shape: 'rectangle' as ElementType, stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.14)', badge: '🔒' };
  }
  if (lower.includes('queue') || lower.includes('kafka') || lower.includes('rabbitmq') || lower.includes('sqs')) {
    return { shape: 'ellipse' as ElementType, stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.14)', badge: '📬' };
  }
  if (lower.includes('client') || lower.includes('user') || lower.includes('browser') || lower.includes('frontend') || lower.includes('app')) {
    return { shape: 'rectangle' as ElementType, stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.14)', badge: '📱' };
  }
  const base = PALETTES[defaultPalette];
  return { shape: 'rectangle' as ElementType, stroke: base.stroke, fill: base.fill, badge: '📦' };
}

/**
 * Parses markdown notes or Eraser-style DSL into nodes and directed connections.
 */
export function parseDocToGraph(docText: string): { nodes: ParsedNode[]; connections: ParsedConnection[] } {
  const lines = docText.split('\n');
  const nodes: ParsedNode[] = [];
  const connections: ParsedConnection[] = [];
  const nodeSet = new Set<string>();

  const ensureNode = (text: string, level = 1, category?: string) => {
    const clean = text.trim();
    if (!clean) return '';
    if (!nodeSet.has(clean)) {
      nodeSet.add(clean);
      nodes.push({
        id: `node-${Date.now()}-${nodes.length}-${Math.floor(Math.random() * 1000)}`,
        text: clean,
        level,
        category,
      });
    }
    return clean;
  };

  let currentCategory = 'General';
  let lastNodeByLevel: Record<number, string> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Check for Eraser-style direct connection syntax: "A > B: label" or "A -> B"
    const arrowMatch = line.match(/^(.+?)\s*(?:>|->|-->)\s*(.+)$/);
    if (arrowMatch) {
      const fromParts = arrowMatch[1].split(',').map((s) => s.trim());
      const rightPart = arrowMatch[2].trim();
      let toStr = rightPart;
      let label: string | undefined;

      if (rightPart.includes(':')) {
        const colonIdx = rightPart.indexOf(':');
        toStr = rightPart.slice(0, colonIdx).trim();
        label = rightPart.slice(colonIdx + 1).trim();
      }

      const toParts = toStr.split(',').map((s) => s.trim());

      for (const fromName of fromParts) {
        if (!fromName) continue;
        ensureNode(fromName, 1, currentCategory);
        for (const toName of toParts) {
          if (!toName) continue;
          ensureNode(toName, 1, currentCategory);
          connections.push({ from: fromName, to: toName, label });
        }
      }
      continue;
    }

    // 2. Headings (# Heading 1, ## Heading 2, etc.)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      currentCategory = text;
      ensureNode(text, level, currentCategory);

      // Connect subheadings to their parent heading
      if (level > 1 && lastNodeByLevel[level - 1]) {
        connections.push({ from: lastNodeByLevel[level - 1], to: text });
      }
      lastNodeByLevel[level] = text;
      // Clear deeper levels
      for (let l = level + 1; l <= 6; l++) delete lastNodeByLevel[l];
      continue;
    }

    // 3. Bullet points (- item, * item, 1. item)
    const listMatch = line.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const text = listMatch[1].replace(/\[[ xX]\]/, '').trim();
      if (!text) continue;

      // Determine indentation level
      const indent = rawLine.search(/\S/);
      const level = Math.floor(indent / 2) + 2;

      ensureNode(text, level, currentCategory);

      // Connect to parent heading or parent list item
      const parent = lastNodeByLevel[level - 1] || lastNodeByLevel[1];
      if (parent && parent !== text) {
        connections.push({ from: parent, to: text });
      }
      lastNodeByLevel[level] = text;
      continue;
    }
  }

  // Fallback defaults if the document is empty
  if (nodes.length === 0) {
    const defaultFlow = ['Client App', 'API Gateway', 'Auth Service', 'PostgreSQL DB'];
    defaultFlow.forEach((name, i) => {
      ensureNode(name, 1);
      if (i > 0) {
        connections.push({ from: defaultFlow[i - 1], to: name });
      }
    });
  }

  return { nodes, connections };
}

/**
 * Converts a parsed document graph into production CanvasElement shapes and bound arrows.
 */
export function generateDiagramElements(
  docText: string,
  options: GenerateDiagramOptions
): CanvasElement[] {
  const { layout, palette, placement, styleMode, existingElements } = options;
  const { nodes, connections } = parseDocToGraph(docText);

  // Determine starting coordinates based on placement
  let startX = 140;
  let startY = 160;

  if (placement !== 'replace' && existingElements.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of existingElements) {
      if (el.isDeleted) continue;
      const b = getElementBounds(el);
      minX = Math.min(minX, b.minX);
      minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX);
      maxY = Math.max(maxY, b.maxY);
    }

    if (maxX > -Infinity) {
      if (placement === 'below') {
        startX = Math.max(100, minX);
        startY = maxY + 140;
      } else if (placement === 'right') {
        startX = maxX + 160;
        startY = Math.max(100, minY);
      }
    }
  }

  const generatedElements: CanvasElement[] = [];
  const nodeNameToElement = new Map<string, CanvasElement>();

  // Dimensions
  const nodeWidth = 200;
  const nodeHeight = 85;

  // 1. Layout Positioning Logic
  if (layout === 'architecture' || layout === 'sequence') {
    // Pipeline / Flowchart layout (horizontal snake or linear flow)
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(nodes.length * 1.5))));
    const gapX = 110;
    const gapY = 120;

    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // Snake back-and-forth for organic diagram flows
      const actualCol = row % 2 === 0 ? col : cols - 1 - col;

      const x = startX + actualCol * (nodeWidth + gapX);
      const y = startY + row * (nodeHeight + gapY);

      const arch = getArchetype(node.text, palette);
      const shapeType = arch.shape;
      const shapeId = `gen-node-${Date.now()}-${i}`;

      const el: CanvasElement = {
        id: shapeId,
        type: shapeType,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
        angle: 0,
        strokeColor: arch.stroke,
        backgroundColor: arch.fill,
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: styleMode === 'rough' ? 1.2 : 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        text: layout === 'sequence' ? `${i + 1}. ${node.text}` : `${arch.badge} ${node.text}`,
        fontSize: 14,
        textAlign: 'center',
      };

      generatedElements.push(el);
      nodeNameToElement.set(node.text, el);
    });
  } else if (layout === 'mindmap') {
    // Hierarchy / Mindmap tree layout
    const rootNode = nodes[0];
    const childNodes = nodes.slice(1);
    const branchCount = Math.max(1, childNodes.length);
    const totalHeight = branchCount * (nodeHeight + 40);

    const rootX = startX;
    const rootY = startY + totalHeight / 2 - nodeHeight / 2;
    const rootArch = getArchetype(rootNode.text, palette);

    const rootEl: CanvasElement = {
      id: `gen-root-${Date.now()}`,
      type: 'rectangle',
      x: rootX,
      y: rootY,
      width: nodeWidth + 30,
      height: nodeHeight + 10,
      angle: 0,
      strokeColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.22)',
      fillStyle: 'solid',
      strokeWidth: 2.5,
      strokeStyle: 'solid',
      roughness: styleMode === 'rough' ? 1.2 : 0,
      opacity: 100,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      updatedAt: Date.now(),
      text: `🌟 ${rootNode.text}`,
      fontSize: 16,
      textAlign: 'center',
    };
    generatedElements.push(rootEl);
    nodeNameToElement.set(rootNode.text, rootEl);

    childNodes.forEach((child, idx) => {
      const childX = rootX + nodeWidth + 160;
      const childY = startY + idx * (nodeHeight + 40);
      const arch = getArchetype(child.text, palette);

      const childEl: CanvasElement = {
        id: `gen-child-${Date.now()}-${idx}`,
        type: 'rectangle',
        x: childX,
        y: childY,
        width: nodeWidth,
        height: nodeHeight,
        angle: 0,
        strokeColor: arch.stroke,
        backgroundColor: arch.fill,
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: styleMode === 'rough' ? 1.2 : 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        text: child.text,
        fontSize: 13,
        textAlign: 'center',
      };
      generatedElements.push(childEl);
      nodeNameToElement.set(child.text, childEl);
    });
  } else {
    // 'grid' layout (Categorized column clusters)
    const categoryMap = new Map<string, ParsedNode[]>();
    nodes.forEach((n) => {
      const cat = n.category || 'Components';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(n);
    });

    const categories = Array.from(categoryMap.keys());
    const colWidth = nodeWidth + 40;
    const colGap = 80;

    categories.forEach((catName, colIdx) => {
      const catNodes = categoryMap.get(catName)!;
      const colX = startX + colIdx * (colWidth + colGap);
      const colHeight = catNodes.length * (nodeHeight + 30) + 60;

      // Group Background Frame
      const groupFrame: CanvasElement = {
        id: `gen-group-${Date.now()}-${colIdx}`,
        type: 'rectangle',
        x: colX - 20,
        y: startY - 40,
        width: colWidth,
        height: colHeight,
        angle: 0,
        strokeColor: '#cbd5e1',
        backgroundColor: 'rgba(241, 245, 249, 0.5)',
        fillStyle: 'solid',
        strokeWidth: 1.5,
        strokeStyle: 'dashed',
        roughness: 0,
        opacity: 90,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        text: `📁 ${catName}`,
        fontSize: 14,
        textAlign: 'center',
      };
      generatedElements.push(groupFrame);

      catNodes.forEach((node, rowIdx) => {
        const itemY = startY + 20 + rowIdx * (nodeHeight + 30);
        const arch = getArchetype(node.text, palette);

        const cardEl: CanvasElement = {
          id: `gen-card-${Date.now()}-${colIdx}-${rowIdx}`,
          type: arch.shape,
          x: colX,
          y: itemY,
          width: nodeWidth,
          height: nodeHeight,
          angle: 0,
          strokeColor: arch.stroke,
          backgroundColor: arch.fill,
          fillStyle: 'solid',
          strokeWidth: 2,
          strokeStyle: 'solid',
          roughness: styleMode === 'rough' ? 1.2 : 0,
          opacity: 100,
          seed: Math.floor(Math.random() * 100000),
          version: 1,
          versionNonce: 1,
          isDeleted: false,
          updatedAt: Date.now(),
          text: node.text,
          fontSize: 13,
          textAlign: 'center',
        };
        generatedElements.push(cardEl);
        nodeNameToElement.set(node.text, cardEl);
      });
    });
  }

  // 2. Generate Smart Bound Arrows Connecting Nodes
  const addedConnectionKeys = new Set<string>();

  // If explicit connections exist from syntax or hierarchy:
  if (connections.length > 0) {
    connections.forEach((conn, idx) => {
      const sourceEl = nodeNameToElement.get(conn.from);
      const targetEl = nodeNameToElement.get(conn.to);
      if (!sourceEl || !targetEl || sourceEl.id === targetEl.id) return;

      const connKey = `${sourceEl.id}->${targetEl.id}`;
      if (addedConnectionKeys.has(connKey)) return;
      addedConnectionKeys.add(connKey);

      // Determine optimal anchor sides based on relative position
      const isTargetRight = targetEl.x >= sourceEl.x + sourceEl.width / 2;
      const isTargetBelow = targetEl.y >= sourceEl.y + sourceEl.height;

      let startPos: 'top' | 'right' | 'bottom' | 'left' = 'right';
      let endPos: 'top' | 'right' | 'bottom' | 'left' = 'left';

      let startPoint = { x: sourceEl.x + sourceEl.width, y: sourceEl.y + sourceEl.height / 2 };
      let endPoint = { x: targetEl.x, y: targetEl.y + targetEl.height / 2 };

      if (!isTargetRight) {
        if (isTargetBelow) {
          startPos = 'bottom';
          endPos = 'top';
          startPoint = { x: sourceEl.x + sourceEl.width / 2, y: sourceEl.y + sourceEl.height };
          endPoint = { x: targetEl.x + targetEl.width / 2, y: targetEl.y };
        } else {
          startPos = 'left';
          endPos = 'right';
          startPoint = { x: sourceEl.x, y: sourceEl.y + sourceEl.height / 2 };
          endPoint = { x: targetEl.x + targetEl.width, y: targetEl.y + targetEl.height / 2 };
        }
      }

      const arrowId = `gen-arrow-${Date.now()}-${idx}`;
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;

      const startBinding: ArrowBinding = {
        elementId: sourceEl.id,
        focus: 0,
        anchorPosition: startPos,
      };

      const endBinding: ArrowBinding = {
        elementId: targetEl.id,
        focus: 0,
        anchorPosition: endPos,
      };

      const arrowEl: CanvasElement = {
        id: arrowId,
        type: 'arrow',
        x: startPoint.x,
        y: startPoint.y,
        width: dx,
        height: dy,
        angle: 0,
        strokeColor: '#94a3b8',
        backgroundColor: 'transparent',
        fillStyle: 'none',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: styleMode === 'rough' ? 1 : 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        points: [
          { x: 0, y: 0 },
          { x: dx, y: dy },
        ],
        endArrowhead: 'arrow',
        startBinding,
        endBinding,
        text: conn.label || undefined,
        fontSize: 12,
      };

      generatedElements.push(arrowEl);
    });
  } else {
    // Sequential fallback: Link i -> i+1
    const nodeElements = generatedElements.filter((e) => e.type !== 'arrow');
    for (let i = 0; i < nodeElements.length - 1; i++) {
      const source = nodeElements[i];
      const target = nodeElements[i + 1];

      const arrowStartX = source.x + source.width;
      const arrowStartY = source.y + source.height / 2;
      const arrowEndX = target.x;
      const arrowEndY = target.y + target.height / 2;

      const dx = arrowEndX - arrowStartX;
      const dy = arrowEndY - arrowStartY;

      generatedElements.push({
        id: `gen-arrow-${Date.now()}-${i}`,
        type: 'arrow',
        x: arrowStartX,
        y: arrowStartY,
        width: dx,
        height: dy,
        angle: 0,
        strokeColor: '#94a3b8',
        backgroundColor: 'transparent',
        fillStyle: 'none',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: styleMode === 'rough' ? 1 : 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        updatedAt: Date.now(),
        points: [
          { x: 0, y: 0 },
          { x: dx, y: dy },
        ],
        endArrowhead: 'arrow',
        startBinding: { elementId: source.id, focus: 0, anchorPosition: 'right' },
        endBinding: { elementId: target.id, focus: 0, anchorPosition: 'left' },
      });
    }
  }

  return generatedElements;
}
