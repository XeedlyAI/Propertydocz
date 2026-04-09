"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

interface FadeUpProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition"> {
  children: ReactNode;
  /** Delay in seconds before animation starts (default: 0) */
  delay?: number;
  /** Duration in seconds (default: 0.35) */
  duration?: number;
  className?: string;
}

/**
 * Fades in and slides up. Respects prefers-reduced-motion via
 * Framer Motion's built-in reducedMotion support.
 */
export function FadeUp({
  children,
  delay = 0,
  duration = 0.35,
  className,
  ...props
}: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition"> {
  children: ReactNode;
  /** Delay between each child animation in seconds (default: 0.1) */
  staggerDelay?: number;
  className?: string;
}

/**
 * Wrapper that staggers the entrance of its direct motion children.
 * Each child should use `variants` with `hidden` and `visible` keys,
 * or be a FadeUpChild component.
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
  ...props
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface FadeUpChildProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  children: ReactNode;
  className?: string;
}

/**
 * Child component designed for use inside StaggerContainer.
 * Automatically picks up stagger timing from parent.
 */
export function FadeUpChild({ children, className, ...props }: FadeUpChildProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: "easeOut" },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
