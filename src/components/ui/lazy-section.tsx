"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  /** Minimum height placeholder shown before the section becomes visible */
  placeholderHeight?: string;
  /** Margin before the element enters the viewport to start loading (default 300px) */
  rootMargin?: string;
}

/**
 * Defers rendering of below-the-fold content until it's near the viewport.
 * Reduces TBT (Total Blocking Time) by not executing expensive React trees
 * during the initial page paint.
 */
export function LazySection({
  children,
  className,
  placeholderHeight = "h-64",
  rootMargin = "300px",
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If IntersectionObserver is not supported, just render immediately
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    // If page was opened with a hash anchor, render immediately for deep-linking
    if (window.location.hash) {
      setVisible(true);
      return;
    }

    const onHashChange = () => setVisible(true);
    window.addEventListener("hashchange", onHashChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
          window.removeEventListener("hashchange", onHashChange);
        }
      },
      { rootMargin: rootMargin ?? "400px" }
    );

    const el = ref.current;
    if (el) observer.observe(el);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : <div className={`${placeholderHeight} bg-cream/20`} aria-hidden="true" />}
    </div>
  );
}

