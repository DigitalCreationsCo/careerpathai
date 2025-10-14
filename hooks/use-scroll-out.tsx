import { useEffect, useRef, type RefObject } from "react";

/**
 * useScrollOutOfViewOnScroll
 * This hook hides a component (e.g., header, toolbar) by applying a "scrolled-out" class
 * when the user scrolls down beyond a specified threshold.
 * It will re-show (remove the class) when scrolling up, or near the top.
 */
export function useScrollOutOfViewOnScroll<T extends HTMLElement>(
  threshold: number = 64 // px scrolled before hiding
): RefObject<T> {
  const ref = useRef<T>(null);
  const lastScrollTop = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    function handleScroll() {
      if (!ref.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollingDown = scrollTop > lastScrollTop.current;

      if (scrollTop <= threshold) {
        // Always show at the top
        ref.current.classList.remove("scrolled-out");
      } else {
        if (scrollingDown) {
          ref.current.classList.add("scrolled-out");
        } else {
          ref.current.classList.remove("scrolled-out");
        }
      }

      lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;
      ticking.current = false;
    }

    function onScroll() {
      if (!ticking.current) {
        window.requestAnimationFrame(handleScroll);
        ticking.current = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return ref;
}
