import type { Request, Response } from "express";
import { applyDocumentMeta, isAppPath, metaForPath, normalizePath, ROBOTS_NOINDEX, type DocumentExtras } from "@shared/site";
import { howItWorksFaqSchema, renderHowItWorksHtml } from "@shared/how-it-works";

function extrasForPath(path: string): DocumentExtras {
  if (path === "/how-it-works") {
    return { prerender: renderHowItWorksHtml(), schema: [howItWorksFaqSchema()] };
  }
  return {};
}

export function requestOrigin(req: Request) {
  const env = process.env.APP_PUBLIC_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.get("x-forwarded-host") || req.get("host");
  if (!host) return "";
  const proto = (req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0].trim();
  return `${proto}://${host}`;
}

/** Full request path. Inside a catch-all `app.use`, Express rewrites `req.path` to "/". */
export function requestPath(req: Request) {
  return normalizePath(req.originalUrl || req.url || "/");
}

export function htmlForRequest(html: string, req: Request) {
  const path = requestPath(req);
  return applyDocumentMeta(html, path, requestOrigin(req), extrasForPath(path));
}

export function pageStatus(pathname: string) {
  return isAppPath(normalizePath(pathname)) ? 200 : 404;
}

export function sendPage(req: Request, res: Response, html: string) {
  const path = requestPath(req);
  const headers: Record<string, string> = { "Content-Type": "text/html; charset=utf-8" };
  if (!metaForPath(path).index) headers["X-Robots-Tag"] = ROBOTS_NOINDEX;
  res.status(pageStatus(path)).set(headers).end(htmlForRequest(html, req));
}
