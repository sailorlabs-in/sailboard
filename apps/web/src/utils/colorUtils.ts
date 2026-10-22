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

  // Contrast / Auto Adaptive Color
  if (trimmed === 'contrast' || trimmed === 'auto') {
    return {
      r: 248,
      g: 250,
      b: 252,
      alpha: 1,
      opacityPercent: 100,
      isTransparent: false,
      baseHex: 'contrast',
    };
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
 * Calculates WCAG relative luminance from 0.0 (darkest) to 1.0 (lightest).
 */
export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Computes WCAG contrast ratio between two luminance values.
 * Returns a value from 1:1 (same) to 21:1 (black vs white).
 */
export function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Resolves stroke color. If set to 'contrast' (or missing), returns
 * high-contrast color depending on canvas theme (dark vs light).
 */
export function getEffectiveStrokeColor(
  color: string | undefined,
  isDark: boolean
): string {
  if (!color || color === 'contrast' || color === 'auto') {
    return isDark ? '#f8fafc' : '#0f172a';
  }
  return color;
}

/**
 * Resolves background fill color and opacity. If set to 'contrast', returns
 * an adaptive contrast tint for dark or light theme.
 */
export function getEffectiveBackgroundColor(
  backgroundColor?: string,
  fillOpacity?: number,
  isDark?: boolean
): string | undefined {
  if (!backgroundColor || backgroundColor === 'transparent' || backgroundColor === 'none') {
    return undefined;
  }
  if (fillOpacity !== undefined && fillOpacity <= 0) {
    return undefined;
  }

  if (backgroundColor === 'contrast' || backgroundColor === 'auto') {
    const opacity = fillOpacity !== undefined ? fillOpacity : 15;
    if (opacity >= 95) {
      return isDark ? '#1e293b' : '#f1f5f9';
    }
    const alpha = Math.round((opacity / 100) * 0.8 * 100) / 100;
    return isDark
      ? `rgba(255, 255, 255, ${Math.max(0.08, alpha)})`
      : `rgba(15, 23, 42, ${Math.max(0.06, alpha)})`;
  }

  if (fillOpacity !== undefined && fillOpacity < 100 && !backgroundColor.startsWith('rgba')) {
    return applyFillOpacity(backgroundColor, fillOpacity);
  }
  return backgroundColor;
}

/**
 * Resolves text color based on outer section (shape fill background or canvas theme).
 * If textColor is 'contrast' (or missing), automatically chooses dark or light text
 * to guarantee optimal readability against the underlying background.
 */
export function getEffectiveTextColor(
  textColor: string | undefined,
  element: { x: number; y: number; width: number; height: number; type: string; backgroundColor?: string; fillOpacity?: number; strokeColor?: string },
  isDark: boolean,
  allElements?: any[]
): string {
  // Canvas background colors:
  // Dark mode canvas is #121622 (rgb: 18, 22, 34)
  // Light mode canvas is #e2e8f0 (rgb: 226, 232, 240)
  const canvasRGB = isDark ? { r: 18, g: 22, b: 34 } : { r: 226, g: 232, b: 240 };
  const canvasLum = getLuminance(canvasRGB.r, canvasRGB.g, canvasRGB.b);

  // If textColor is an explicit color (not contrast/auto), verify it has
  // sufficient contrast against the effective background. If not, override
  // with a theme-appropriate readable color so text is never invisible.
  if (textColor && textColor !== 'contrast' && textColor !== 'auto') {
    const parsed = parseColor(textColor);
    if (!parsed.isTransparent) {
      // Determine effective background luminance
      let bgLum = canvasLum;
      const bg = element.backgroundColor;
      const fillOp = element.fillOpacity;
      if (bg && bg !== 'transparent' && bg !== 'none' && bg !== 'contrast' && bg !== 'auto' && fillOp !== 0) {
        const parsedBg = parseColor(bg);
        const alpha = (fillOp !== undefined ? fillOp : parsedBg.opacityPercent) / 100;
        const compR = Math.round(parsedBg.r * alpha + canvasRGB.r * (1 - alpha));
        const compG = Math.round(parsedBg.g * alpha + canvasRGB.g * (1 - alpha));
        const compB = Math.round(parsedBg.b * alpha + canvasRGB.b * (1 - alpha));
        bgLum = getLuminance(compR, compG, compB);
      }
      const textLum = getLuminance(parsed.r, parsed.g, parsed.b);
      const ratio = getContrastRatio(textLum, bgLum);
      // WCAG AA minimum for large text is 3:1; if contrast is too low,
      // override with a readable color for the current theme.
      if (ratio < 2.5) {
        return isDark ? '#f8fafc' : '#0f172a';
      }
    }
    return textColor;
  }

  // 1. If standalone text, check if it lies over an underlying filled shape
  if (element.type === 'text' && allElements && allElements.length > 0) {
    const textCenter = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
    const elIndex = allElements.indexOf(element);
    let hitShape: any;
    for (let i = (elIndex > 0 ? elIndex : allElements.length) - 1; i >= 0; i--) {
      const candidate = allElements[i];
      if (candidate.isDeleted || candidate.id === (element as any).id) continue;
      if (
        candidate.type === 'line' ||
        candidate.type === 'arrow' ||
        candidate.type === 'draw' ||
        candidate.type === 'text'
      )
        continue;
      const bMinX = Math.min(candidate.x, candidate.x + candidate.width);
      const bMaxX = Math.max(candidate.x, candidate.x + candidate.width);
      const bMinY = Math.min(candidate.y, candidate.y + candidate.height);
      const bMaxY = Math.max(candidate.y, candidate.y + candidate.height);
      if (
        textCenter.x >= bMinX &&
        textCenter.x <= bMaxX &&
        textCenter.y >= bMinY &&
        textCenter.y <= bMaxY
      ) {
        hitShape = candidate;
        break;
      }
    }

    if (hitShape) {
      // Evaluate outer section from the underlying shape
      return getEffectiveTextColor('contrast', hitShape, isDark);
    }

    // Default standalone text on canvas:
    return isDark ? '#f8fafc' : '#0f172a';
  }

  // 2. Shape with text inside (rectangle, diamond, ellipse, sticky note)
  const bg = element.backgroundColor;
  const fillOp = element.fillOpacity;

  // Sticky note has paper background
  if (element.type === 'sticky') {
    const stickyBg = bg || (isDark ? '#3b3218' : '#fef08a');
    const parsed = parseColor(stickyBg);
    const lum = getLuminance(parsed.r, parsed.g, parsed.b);
    return lum > 0.45 ? '#0f172a' : '#f8fafc';
  }

  // Transparent or no fill -> outer section is the canvas theme
  if (!bg || bg === 'transparent' || bg === 'none' || fillOp === 0) {
    return isDark ? '#f8fafc' : '#0f172a';
  }

  if (bg === 'contrast' || bg === 'auto') {
    // Contrast fill is a subtle tint over canvas theme, so effective background matches theme
    return isDark ? '#f8fafc' : '#0f172a';
  }

  // Colored fill: composite with canvas background taking opacity into account
  const parsed = parseColor(bg);
  const alpha = (fillOp !== undefined ? fillOp : parsed.opacityPercent) / 100;
  const compR = Math.round(parsed.r * alpha + canvasRGB.r * (1 - alpha));
  const compG = Math.round(parsed.g * alpha + canvasRGB.g * (1 - alpha));
  const compB = Math.round(parsed.b * alpha + canvasRGB.b * (1 - alpha));

  const lum = getLuminance(compR, compG, compB);
  // If background luminance is high (light), return dark text; otherwise return light text
  return lum > 0.45 ? '#0f172a' : '#f8fafc';
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
  if (color === 'contrast' || color === 'auto') {
    return 'contrast';
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
  activeColor: string | undefined,
  swatchColor: string,
  isFill = false
): boolean {
  if (!activeColor) {
    return isFill ? swatchColor === 'transparent' : swatchColor === 'contrast';
  }
  if (activeColor === 'contrast' || activeColor === 'auto') {
    return swatchColor === 'contrast';
  }
  if (swatchColor === 'contrast') {
    return activeColor === 'contrast' || activeColor === 'auto';
  }
  const parsed = parseColor(activeColor);
  if (swatchColor === 'transparent') {
    return parsed.isTransparent;
  }
  if (parsed.isTransparent) {
    return false;
  }
  return parsed.baseHex.toLowerCase() === swatchColor.toLowerCase();
}
