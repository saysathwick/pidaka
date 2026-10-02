import { useEffect } from "react";
import { metaForPath, normalizePath, ROBOTS_INDEX, ROBOTS_NOINDEX } from "@shared/site";

function setAttr(selector: string, attr: "content" | "href", value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function usePageMeta(pathname: string) {
  useEffect(() => {
    const meta = metaForPath(pathname);
    const previous = document.title;
    document.title = meta.title;
    setAttr('meta[name="description"]', "content", meta.description);
    setAttr('meta[name="robots"]', "content", meta.index ? ROBOTS_INDEX : ROBOTS_NOINDEX);
    setAttr('meta[property="og:title"]', "content", meta.title);
    setAttr('meta[property="og:description"]', "content", meta.description);
    setAttr('meta[name="twitter:title"]', "content", meta.title);
    setAttr('meta[name="twitter:description"]', "content", meta.description);
    const origin = window.location.origin;
    const canonical = `${origin}${normalizePath(pathname)}`;
    setAttr('link[rel="canonical"]', "href", canonical);
    setAttr('meta[property="og:url"]', "content", canonical);
    setAttr('meta[property="og:image"]', "content", `${origin}/og.png`);
    setAttr('meta[name="twitter:image"]', "content", `${origin}/og.png`);
    return () => {
      document.title = previous;
    };
  }, [pathname]);
}
