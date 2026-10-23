import React, { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Box, Tooltip, SxProps, Theme } from '@mui/material';
import gsap from 'gsap';
import { prefersReducedMotion } from '../utils/animations';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  hideBelowLg?: boolean;
  hideOnMobile?: boolean;
  disabled?: boolean;
}

export interface NeuSegmentedControlProps<T extends string = string> {
  options: Array<{
    value: T | (string & {});
    label: React.ReactNode;
    icon?: React.ReactNode;
    tooltip?: string;
    hideBelowLg?: boolean;
    hideOnMobile?: boolean;
    disabled?: boolean;
  }>;
  value: T;
  onChange: (value: T) => void;
  size?: 'small' | 'medium';
  className?: string;
  sx?: SxProps<Theme>;
  ariaLabel?: string;
}

export function NeuSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'medium',
  className = '',
  sx,
  ariaLabel,
}: NeuSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const hoverIndicatorRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Map<T, HTMLElement>>(new Map());
  const isFirstRender = useRef(true);
  const isGlidingRef = useRef(false);
  const isHoverActiveRef = useRef(false);
  const lastContentSize = useRef<{ width: number; height: number } | null>(null);

  const getButtonGeometry = useCallback((btn: HTMLElement) => {
    const container = containerRef.current;
    if (!container || !btn) return null;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    if (btnRect.width === 0 || btnRect.height === 0) return null;

    const clientLeft = container.clientLeft || 0;
    const clientTop = container.clientTop || 0;

    return {
      x: btnRect.left - containerRect.left - clientLeft,
      y: btnRect.top - containerRect.top - clientTop,
      width: btnRect.width,
      height: btnRect.height,
    };
  }, []);

  // Vercel-Style Active Indicator Sliding
  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    const activeBtn = buttonRefs.current.get(value);

    if (!container || !indicator || !activeBtn) {
      if (indicator) indicator.style.opacity = '0';
      return;
    }

    const geo = getButtonGeometry(activeBtn);
    if (!geo) {
      gsap.to(indicator, { opacity: 0, duration: 0.15, overwrite: 'auto' });
      return;
    }

    if (isFirstRender.current || prefersReducedMotion()) {
      isFirstRender.current = false;
      gsap.set(indicator, {
        x: geo.x,
        y: geo.y,
        width: geo.width,
        height: geo.height,
        opacity: 1,
      });
    } else {
      isGlidingRef.current = true;
      gsap.killTweensOf(indicator);
      gsap.to(indicator, {
        x: geo.x,
        y: geo.y,
        width: geo.width,
        height: geo.height,
        opacity: 1,
        duration: 0.32,
        ease: 'power3.out', // Silky smooth deceleration curve without overshoot or jumping
        overwrite: 'auto',
        onComplete: () => {
          isGlidingRef.current = false;
        },
      });
    }
  }, [value, getButtonGeometry]);

  // Vercel-Style Hover Glider interaction
  const handlePointerEnterTab = (btnEl: HTMLElement) => {
    if (prefersReducedMotion()) return;
    const hoverEl = hoverIndicatorRef.current;
    if (!hoverEl) return;

    const geo = getButtonGeometry(btnEl);
    if (!geo) return;

    if (isHoverActiveRef.current) {
      // Smoothly glide across tabs as mouse traverses
      gsap.to(hoverEl, {
        x: geo.x,
        y: geo.y,
        width: geo.width,
        height: geo.height,
        opacity: 1,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    } else {
      // First hover entrance: position instantly under button and fade in
      isHoverActiveRef.current = true;
      gsap.set(hoverEl, {
        x: geo.x,
        y: geo.y,
        width: geo.width,
        height: geo.height,
      });
      gsap.to(hoverEl, {
        opacity: 1,
        duration: 0.16,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    }
  };

  const handlePointerLeaveContainer = () => {
    isHoverActiveRef.current = false;
    const hoverEl = hoverIndicatorRef.current;
    if (hoverEl) {
      gsap.to(hoverEl, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  // Re-adjust on container resize & window resize (without breaking in-flight glides)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      if (isGlidingRef.current) return;

      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (
          lastContentSize.current &&
          Math.abs(width - lastContentSize.current.width) < 0.5 &&
          Math.abs(height - lastContentSize.current.height) < 0.5
        ) {
          continue;
        }
        lastContentSize.current = { width, height };

        const activeBtn = buttonRefs.current.get(value);
        const indicator = indicatorRef.current;
        if (!activeBtn || !indicator) return;

        const geo = getButtonGeometry(activeBtn);
        if (geo) {
          gsap.set(indicator, {
            x: geo.x,
            y: geo.y,
            width: geo.width,
            height: geo.height,
            opacity: 1,
          });
        }
      }
    });

    ro.observe(container);

    const handleWindowResize = () => {
      if (isGlidingRef.current) return;
      const activeBtn = buttonRefs.current.get(value);
      const indicator = indicatorRef.current;
      if (!activeBtn || !indicator) return;
      const geo = getButtonGeometry(activeBtn);
      if (geo) {
        gsap.set(indicator, {
          x: geo.x,
          y: geo.y,
          width: geo.width,
          height: geo.height,
          opacity: 1,
        });
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [value, getButtonGeometry]);

  const handleClick = (optValue: T, disabled?: boolean) => {
    if (disabled) return;
    if (optValue !== value) {
      onChange(optValue);
    }
  };

  const isSmall = size === 'small';

  return (
    <Box
      ref={containerRef}
      className={`neu-segmented has-indicator ${className}`}
      aria-label={ariaLabel}
      onPointerLeave={handlePointerLeaveContainer}
      sx={{
        p: isSmall ? '2px' : '4px',
        gap: isSmall ? '2px' : '4px',
        ...sx,
      }}
    >
      {/* Vercel-Style Hover Glider Pill */}
      <Box
        ref={hoverIndicatorRef}
        className="neu-segmented-hover-indicator"
        sx={{
          borderRadius: isSmall ? '6px' : '8px',
        }}
      />

      {/* Dynamic Sliding Pill Indicator (Active Tab) */}
      <Box
        ref={indicatorRef}
        className="neu-segmented-indicator"
        sx={{
          borderRadius: isSmall ? '6px' : '8px',
        }}
      />

      {options.map((opt) => {
        const isActive = opt.value === value;
        const button = (
          <Box
            component="button"
            key={opt.value}
            ref={(el: HTMLElement | null) => {
              if (el) {
                buttonRefs.current.set(opt.value as T, el);
              } else {
                buttonRefs.current.delete(opt.value as T);
              }
            }}
            type="button"
            disabled={opt.disabled}
            className={`neu-segmented-item ${isActive ? 'active' : ''}`}
            onPointerEnter={(e: React.PointerEvent<HTMLElement>) =>
              handlePointerEnterTab(e.currentTarget)
            }
            onClick={() => handleClick(opt.value as T, opt.disabled)}
            sx={{
              display: opt.hideBelowLg
                ? { xs: 'none', lg: 'inline-flex' }
                : 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isSmall ? 0.4 : 0.6,
              px: isSmall ? '7px' : '11px',
              py: isSmall ? '3px' : '5px',
              fontSize: isSmall ? '0.72rem' : '0.8rem',
              fontWeight: 600,
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
              opacity: opt.disabled ? 0.4 : 1,
              outline: 'none',
              whiteSpace: 'nowrap',
              border: 'none',
              background: 'transparent',
              borderRadius: isSmall ? '6px' : '8px',
            }}
          >
            {opt.icon}
            {opt.hideOnMobile ? (
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {opt.label}
              </Box>
            ) : (
              <span>{opt.label}</span>
            )}
          </Box>
        );

        if (opt.tooltip) {
          return (
            <Tooltip
              key={opt.value}
              title={opt.tooltip}
              arrow
              placement="bottom"
              enterDelay={400}
              enterNextDelay={250}
            >
              {button}
            </Tooltip>
          );
        }

        return button;
      })}
    </Box>
  );
}

export default NeuSegmentedControl;
