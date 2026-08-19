import { useEffect } from "react";
import { metaForPath } from "@shared/site";

function setMeta(selector: string, attr: "content", value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function usePageMeta(pathname: string) {
  useEffect(() => {
    const meta = metaForPath(pathname);
    const previous = document.title;
    document.title = meta.title;
    setMeta('meta[name="description"]', "content", meta.description);
    setMeta('meta[property="og:title"]', "content", meta.title);
    setMeta('meta[property="og:description"]', "content", meta.description);
    setMeta('meta[name="twitter:title"]', "content", meta.title);
    setMeta('meta[name="twitter:description"]', "content", meta.description);
    const origin = window.location.origin;
    const canonical = pathname === "/" ? origin : `${origin}${pathname}`;
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[property="og:image"]', "content", `${origin}/og.png`);
    setMeta('meta[name="twitter:image"]', "content", `${origin}/og.png`);
    return () => {
      document.title = previous;
    };
  }, [pathname]);
}
