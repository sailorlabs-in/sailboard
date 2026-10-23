import gsap from 'gsap';
import { useEffect, useRef } from 'react';

// Check for reduced motion preference
export const prefersReducedMotion = (): boolean => {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Premium entrance animation for container child elements (e.g. grids of cards, list items).
 * Uses high-end power3.out easing with subtle scale & translateY.
 */
export const animateStaggerIn = (
  targets: gsap.TweenTarget,
  options?: {
    stagger?: number;
    delay?: number;
    duration?: number;
    y?: number;
    scale?: number;
    ease?: string;
    onComplete?: () => void;
  }
) => {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, scale: 1 });
    options?.onComplete?.();
    return;
  }

  const {
    stagger = 0.05,
    delay = 0,
    duration = 0.55,
    y = 20,
    scale = 0.96,
    ease = 'power3.out',
    onComplete,
  } = options || {};

  return gsap.fromTo(
    targets,
    { opacity: 0, y, scale },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration,
      stagger,
      delay,
      ease,
      clearProps: 'transform,opacity',
      onComplete,
    }
  );
};

/**
 * Slide & fade in from top for headers, topbars, and navigation elements.
 */
export const animateHeaderIn = (
  target: gsap.TweenTarget,
  options?: { delay?: number; duration?: number; y?: number }
) => {
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, y: 0 });
    return;
  }

  const { delay = 0, duration = 0.5, y = -18 } = options || {};

  return gsap.fromTo(
    target,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    }
  );
};

/**
 * Floating Dock Entrance (macOS style bounce/spring dock).
 * Perfect for canvas Toolbar and bottom floating bars.
 */
export const animateDockIn = (
  target: gsap.TweenTarget,
  options?: { delay?: number; duration?: number }
) => {
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, y: 0, scale: 1 });
    return;
  }

  const { delay = 0.05, duration = 0.65 } = options || {};

  return gsap.fromTo(
    target,
    { opacity: 0, y: -28, scale: 0.88 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration,
      delay,
      ease: 'back.out(1.5)',
      clearProps: 'opacity',
    }
  );
};

/**
 * Subtle elastic click feedback for tools and tactile buttons.
 */
export const animateTactileClick = (element: HTMLElement | null) => {
  if (!element || prefersReducedMotion()) return;

  gsap.timeline()
    .to(element, { scale: 0.91, duration: 0.07, ease: 'power2.out' })
    .to(element, { scale: 1, duration: 0.32, ease: 'back.out(2.2)' });
};

/**
 * Tactile magnetic card hover hook.
 * Adds subtle spring lift and slight 3D perspective tilt on mouse move.
 */
export const useCardHover = <T extends HTMLElement = HTMLDivElement>() => {
  const cardRef = useRef<T | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || prefersReducedMotion()) return;

    let bounds: DOMRect;

    const handleMouseEnter = () => {
      bounds = el.getBoundingClientRect();
      gsap.to(el, {
        y: -5,
        scale: 1.018,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!bounds) bounds = el.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;
      const xPct = (mouseX / bounds.width - 0.5) * 2; // -1 to 1
      const yPct = (mouseY / bounds.height - 0.5) * 2; // -1 to 1

      // Subtle tilt (max 3 degrees)
      gsap.to(el, {
        rotationY: xPct * 3,
        rotationX: -yPct * 3,
        transformPerspective: 800,
        duration: 0.2,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        y: 0,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        duration: 0.38,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return cardRef;
};

/**
 * Smooth tab transition animation (slides content gracefully).
 */
export const animateTabTransition = (
  target: gsap.TweenTarget,
  direction: 'left' | 'right' = 'right'
) => {
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, x: 0 });
    return;
  }

  const offset = direction === 'right' ? 24 : -24;

  gsap.fromTo(
    target,
    { opacity: 0, x: offset },
    {
      opacity: 1,
      x: 0,
      duration: 0.36,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    }
  );
};

/**
 * Modal dialog pop-in with backdrop fade.
 */
export const animateModalIn = (target: gsap.TweenTarget) => {
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, scale: 1 });
    return;
  }

  gsap.fromTo(
    target,
    { opacity: 0, scale: 0.93, y: 14 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.38,
      ease: 'back.out(1.2)',
      clearProps: 'transform,opacity',
    }
  );
};

/**
 * Slide a pill indicator element dynamically behind an active tab item (Vercel style).
 */
export const animatePillSlide = (
  pill: HTMLElement | null,
  target: HTMLElement | null,
  container: HTMLElement | null,
  options?: { immediate?: boolean; duration?: number; ease?: string }
) => {
  if (!pill || !target || !container) return;

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  if (targetRect.width === 0 || targetRect.height === 0) {
    gsap.to(pill, { opacity: 0, duration: 0.15, overwrite: 'auto' });
    return;
  }

  const clientLeft = container.clientLeft || 0;
  const clientTop = container.clientTop || 0;
  const x = targetRect.left - containerRect.left - clientLeft;
  const y = targetRect.top - containerRect.top - clientTop;
  const width = targetRect.width;
  const height = targetRect.height;

  const {
    immediate = false,
    duration = 0.32,
    ease = 'power3.out',
  } = options || {};

  if (immediate || prefersReducedMotion()) {
    gsap.set(pill, { x, y, width, height, opacity: 1 });
  } else {
    gsap.killTweensOf(pill);
    gsap.to(pill, {
      x,
      y,
      width,
      height,
      opacity: 1,
      duration,
      ease,
      overwrite: 'auto',
    });
  }
};

/**
 * Canvas Comment Pin Drop animation with physics bounce.
 */
export const animatePinDrop = (
  target: gsap.TweenTarget,
  options?: { delay?: number; onComplete?: () => void }
) => {
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, y: 0, scale: 1 });
    options?.onComplete?.();
    return;
  }

  return gsap.fromTo(
    target,
    { opacity: 0, y: -24, scale: 0.6 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.45,
      delay: options?.delay || 0,
      ease: 'back.out(2)',
      onComplete: options?.onComplete,
    }
  );
};

/**
 * General punchy Pop-in scale animation for badges, indicators, and tooltips.
 */
export const animatePopIn = (
  target: gsap.TweenTarget,
  options?: { duration?: number; scale?: number }
) => {
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, scale: 1 });
    return;
  }

  const { duration = 0.3, scale = 0.8 } = options || {};

  return gsap.fromTo(
    target,
    { opacity: 0, scale },
    {
      opacity: 1,
      scale: 1,
      duration,
      ease: 'back.out(1.8)',
      clearProps: 'transform,opacity',
    }
  );
};

/**
 * Interactive macOS Dock-style spring magnification on hover.
 */
export const animateHoverSpring = (
  element: HTMLElement | null,
  scale = 1.12,
  y = -2
) => {
  if (!element || prefersReducedMotion()) return;
  gsap.to(element, {
    scale,
    y,
    duration: 0.22,
    ease: 'power2.out',
    overwrite: 'auto',
  });
};

/**
 * Interactive hover release reset.
 */
export const animateHoverLeave = (element: HTMLElement | null) => {
  if (!element || prefersReducedMotion()) return;
  gsap.to(element, {
    scale: 1,
    y: 0,
    duration: 0.3,
    ease: 'back.out(2)',
    overwrite: 'auto',
  });
};

export default gsap;

