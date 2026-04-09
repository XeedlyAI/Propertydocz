"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface UseCountUpOptions {
  /** Target value to count up to */
  end: number;
  /** Duration in milliseconds (default: 600) */
  duration?: number;
  /** Start value (default: 0) */
  start?: number;
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Whether to enable the animation (default: true) */
  enabled?: boolean;
}

/**
 * Animates a number from start to end with easeOutCubic easing.
 * Respects prefers-reduced-motion.
 */
export function useCountUp({
  end,
  duration = 600,
  start = 0,
  decimals = 0,
  enabled = true,
}: UseCountUpOptions): number {
  const [value, setValue] = useState(start);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      prefersReducedMotion.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setValue(start);
      return;
    }

    if (prefersReducedMotion.current) {
      setValue(end);
      return;
    }

    const startTime = performance.now();
    const range = end - start;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = start + range * easedProgress;

      setValue(
        decimals > 0
          ? parseFloat(current.toFixed(decimals))
          : Math.round(current)
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration, start, decimals, enabled]);

  return value;
}
