import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { readHearthToken } from "./http-security";

const JWT_SECRET = process.env.SESSION_SECRET!;

export interface AdminRequest extends Request {
  hearth?: boolean;
}

export function adminSecret(): string | null {
  return process.env.ADMIN_SECRET?.trim() || null;
}

export function secretsEqual(provided: string, expected: string) {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function signAdminToken() {
  return jwt.sign({ role: "hearth" }, JWT_SECRET, { expiresIn: "12h", algorithm: "HS256" });
}

export function adminMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
  if (!adminSecret()) {
    return res.status(503).json({ message: "The hearth is not keyed yet" });
  }
  const token = readHearthToken(req);
  if (!token) {
    return res.status(401).json({ message: "Hearth key required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as { role?: string };
    if (decoded.role !== "hearth") {
      return res.status(401).json({ message: "Hearth key required" });
    }
    req.hearth = true;
    next();
  } catch {
    return res.status(401).json({ message: "Hearth key expired" });
  }
}
