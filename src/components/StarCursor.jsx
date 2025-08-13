// src/components/StarCursor.jsx
import { useEffect, useRef } from "react";

export default function StarCursor() {
  const layerRef = useRef(null);
  const starCountRef = useRef(0);
  const MAX_STARS = 120;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 모션 최소화 사용자면 비활성화
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const layer = layerRef.current;
    if (!layer) return;

    const makeStar = (x, y) => {
      // DOM 폭주 방지
      if (starCountRef.current >= MAX_STARS) {
        if (layer.firstChild) {
          layer.firstChild.remove();
          starCountRef.current--;
        }
      }

      const el = document.createElement("div");
      el.className = "star";

      // 약간의 산포로 자연스러운 퍼짐
      const dx = (Math.random() - 0.5) * 40; // -20 ~ 20px
      const dy = (Math.random() - 0.5) * 40;

      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.style.setProperty("--dx", `${dx}px`);
      el.style.setProperty("--dy", `${dy}px`);

      el.addEventListener("animationend", () => {
        el.remove();
        starCountRef.current--;
      });

      layer.appendChild(el);
      starCountRef.current++;
    };

    let rafId = 0;
    const onMove = (x, y) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => makeStar(x, y));
    };

    const mouseHandler = (e) => onMove(e.clientX, e.clientY);
    const touchHandler = (e) => {
      const t = e.touches && e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", mouseHandler, { passive: true });
    window.addEventListener("touchmove", touchHandler, { passive: true });

    return () => {
      window.removeEventListener("mousemove", mouseHandler);
      window.removeEventListener("touchmove", touchHandler);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <div id="star-layer" ref={layerRef} aria-hidden="true" />;
}
