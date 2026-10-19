/**
 * Color and Fill Opacity utilities for Sailboard
 */

export interface ParsedColorInfo {
  r: number;
  g: number;
  b: number;
  alpha: number; // 0.0 - 1.0
  opacityPercent: number; // 0 - 100
  isTransparent: boolean;
  baseHex: string; // #rrggbb (lowercase)
}

/**
 * Parses any CSS color string (hex, rgb, rgba, transparent) into structured RGBA and hex data.
 */
export function parseColor(color: string): ParsedColorInfo {
  if (!color || color === 'transparent' || color === 'none') {
    return {
      r: 99,
      g: 102,
      b: 241,
      alpha: 0,
      opacityPercent: 0,
      isTransparent: true,
      baseHex: 'transparent',
    };
  }

  const trimmed = color.trim().toLowerCase();

  // Match rgb(...) or rgba(...)
  const rgbaMatch = trimmed.match(
    /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (rgbaMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbaMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbaMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbaMatch[3], 10)));
    const alpha =
      rgbaMatch[4] !== undefined
        ? Math.min(1, Math.max(0, parseFloat(rgbaMatch[4])))
        : 1;
    const baseHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    const opacityPercent = Math.round(alpha * 100);
    return {
      r,
      g,
      b,
      alpha,
      opacityPercent,
      isTransparent: opacityPercent === 0,
      baseHex,
    };
  }

  // Match hex (#rgb, #rrggbb, #rrggbbaa)
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return {
        r,
        g,
        b,
        alpha: 1,
        opacityPercent: 100,
        isTransparent: false,
        baseHex: `#${hex}`,
      };
    }
    if (hex.length === 8) {
      const num = parseInt(hex.slice(0, 6), 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const aRaw = parseInt(hex.slice(6, 8), 16) / 255;
      const alpha = Math.min(1, Math.max(0, aRaw));
      const opacityPercent = Math.round(alpha * 100);
      return {
        r,
        g,
        b,
        alpha,
        opacityPercent,
        isTransparent: opacityPercent === 0,
        baseHex: `#${hex.slice(0, 6)}`,
      };
    }
  }

  // Named color fallbacks
  if (trimmed === 'white') {
    return {
      r: 255,
      g: 255,
      b: 255,
      alpha: 1,
      opacityPercent: 100,
      isTransparent: false,
      baseHex: '#ffffff',
    };
  }
  if (trimmed === 'black') {
    return {
      r: 0,
      g: 0,
      b: 0,
      alpha: 1,
      opacityPercent: 100,
      isTransparent: false,
      baseHex: '#000000',
    };
  }

  return {
    r: 99,
    g: 102,
    b: 241,
    alpha: 1,
    opacityPercent: 100,
    isTransparent: false,
    baseHex: trimmed,
  };
}

/**
 * Applies a specific fill opacity percentage (0-100) to a color.
 * Returns 'transparent' for 0%, hex for 100%, and rgba(...) for intermediate values.
 */
export function applyFillOpacity(
  color: string,
  opacityPercent: number,
  fallbackBaseHex = '#6366f1'
): string {
  const clamped = Math.min(100, Math.max(0, Math.round(opacityPercent)));
  if (clamped <= 0) {
    return 'transparent';
  }

  const parsed = parseColor(color);
  let { r, g, b } = parsed;

  if (parsed.isTransparent || parsed.baseHex === 'transparent') {
    const fallback = parseColor(fallbackBaseHex);
    r = fallback.r;
    g = fallback.g;
    b = fallback.b;
  }

  if (clamped === 100) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  const alpha = Math.round((clamped / 100) * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Determines whether the active color matches a given palette swatch,
 * taking into account transparency and alpha channel.
 */
export function isColorMatchingSwatch(
  activeColor: string,
  swatchColor: string
): boolean {
  const parsed = parseColor(activeColor);
  if (swatchColor === 'transparent') {
    return parsed.isTransparent;
  }
  if (parsed.isTransparent) {
    return false;
  }
  return parsed.baseHex.toLowerCase() === swatchColor.toLowerCase();
}
