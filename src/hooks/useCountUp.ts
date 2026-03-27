import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function useCountUp({ end, duration = 800, decimals = 0, prefix = "", suffix = "" }: UseCountUpOptions) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = prevEnd.current;
    prevEnd.current = end;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (end - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(end);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration]);

  const formatted = `${prefix}${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f")}${suffix}`;
  return { value, formatted };
}
