import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import styles from "./MomentsHub.module.css";

interface HeartRevealProps {
  onProgress: (progress: number) => void;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  hint?: ReactNode;
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function HeartReveal({ onProgress, children, footer, header, hint }: HeartRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;

    if (!container || !viewport) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;

    const apply = (progress: number) => {
      viewport.style.setProperty("--reveal", progress.toFixed(4));

      if (Math.abs(progress - progressRef.current) > 0.004 || progress === 1) {
        progressRef.current = progress;
        onProgress(progress);
      }
    };

    if (prefersReducedMotion) {
      apply(1);
      return undefined;
    }

    const update = () => {
      frame = 0;
      const top = window.scrollY + container.getBoundingClientRect().top;
      const travel = Math.max(container.offsetHeight - window.innerHeight, 1);

      apply(clamp((window.scrollY - top) / travel));
    };

    const onScroll = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onProgress]);

  return (
    <div className={styles.scrollSpace} ref={containerRef}>
      <div
        className={styles.viewport}
        ref={viewportRef}
        style={{ "--reveal": 0 } as CSSProperties}
      >
        {header}
        {children}
        {hint}
        {footer}
      </div>
    </div>
  );
}
