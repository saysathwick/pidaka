import type { Request, Response, NextFunction } from "express";

const buckets = new Map<string, { n: number; reset: number }>();

export function clientKey(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = (raw?.split(",")[0] || req.ip || req.socket.remoteAddress || "unknown").trim();
  return ip.replace(/^::ffff:/, "");
}

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 20_000) {
    for (const [k, v] of Array.from(buckets.entries())) {
      if (now > v.reset) buckets.delete(k);
    }
  }
  const current = buckets.get(key);
  if (!current || now > current.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  if (current.n >= max) return false;
  current.n += 1;
  return true;
}

export function limitAuth(req: Request, res: Response, next: NextFunction) {
  const key = `auth:${clientKey(req)}:${req.path}`;
  if (!rateLimit(key, 8, 10 * 60 * 1000)) {
    return res.status(429).json({ message: "Too many tries. Wait a little." });
  }
  next();
}

export function limitHearth(req: Request, res: Response, next: NextFunction) {
  const key = `hearth:${clientKey(req)}`;
  if (!rateLimit(key, 8, 15 * 60 * 1000)) {
    return res.status(429).json({ message: "Too many tries. Wait a little." });
  }
  next();
}

export function limitPush(req: Request, res: Response, next: NextFunction) {
  const key = `push:${clientKey(req)}`;
  if (!rateLimit(key, 20, 60 * 60 * 1000)) {
    return res.status(429).json({ message: "Too many tries. Wait a little." });
  }
  next();
}

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; worker-src 'self'; connect-src 'self'; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
  }
  next();
}

const SESSION_COOKIE = "pidaka_session";
const HEARTH_COOKIE = "pidaka_hearth";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const HEARTH_MAX_AGE = 12 * 60 * 60;

function cookieSecure(res: Response) {
  const req = res.req;
  const proto = String(req.get("x-forwarded-proto") || req.protocol || "")
    .split(",")[0]
    .trim();
  return proto === "https";
}

function serializeCookie(name: string, value: string, maxAgeSec: number, res: Response) {
  const expires = (maxAgeSec <= 0 ? new Date(0) : new Date(Date.now() + maxAgeSec * 1000)).toUTCString();
  const secure = cookieSecure(res) ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}; Expires=${expires}${secure}`;
}

function writeCookie(res: Response, cookie: string) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) {
    res.setHeader("Set-Cookie", [cookie]);
  } else if (Array.isArray(prev)) {
    res.setHeader("Set-Cookie", [...prev.map(String), cookie]);
  } else {
    res.setHeader("Set-Cookie", [String(prev), cookie]);
  }
  res.setHeader("Cache-Control", "private, no-store");
}

export function setSessionCookie(res: Response, token: string) {
  writeCookie(res, serializeCookie(SESSION_COOKIE, token, SESSION_MAX_AGE, res));
}

export function clearSessionCookie(res: Response) {
  writeCookie(res, serializeCookie(SESSION_COOKIE, "", 0, res));
}

export function setHearthCookie(res: Response, token: string) {
  writeCookie(res, serializeCookie(HEARTH_COOKIE, token, HEARTH_MAX_AGE, res));
}

export function clearHearthCookie(res: Response) {
  writeCookie(res, serializeCookie(HEARTH_COOKIE, "", 0, res));
}

export function readCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    const raw = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

function bearerToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export function readSessionToken(req: Request) {
  return readCookie(req, SESSION_COOKIE) || bearerToken(req);
}

export function readHearthToken(req: Request) {
  return readCookie(req, HEARTH_COOKIE) || bearerToken(req);
}
