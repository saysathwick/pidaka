import { useEffect, useState } from "react";

export function useVisualViewport(active = true) {
  const [box, setBox] = useState(() => ({
    top: 0,
    height: typeof window === "undefined" ? 800 : window.innerHeight,
  }));

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const vv = window.visualViewport;
      setBox({
        top: vv?.offsetTop ?? 0,
        height: Math.round(vv?.height ?? window.innerHeight),
      });
    };
    update();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [active]);

  return box;
}
