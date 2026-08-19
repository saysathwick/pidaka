import type { Request } from "express";
import { applyDocumentMeta, isAppPath, normalizePath } from "@shared/site";

export function requestOrigin(req: Request) {
  const env = process.env.APP_PUBLIC_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.get("x-forwarded-host") || req.get("host");
  if (!host) return "";
  const proto = (req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0].trim();
  return `${proto}://${host}`;
}

export function htmlForRequest(html: string, req: Request) {
  return applyDocumentMeta(html, req.path, requestOrigin(req));
}

export function pageStatus(pathname: string) {
  return isAppPath(normalizePath(pathname)) ? 200 : 404;
}
