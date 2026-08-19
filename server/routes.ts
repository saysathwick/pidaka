import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { queueForViewer } from "doorstep";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import { registerSchema, loginSchema, insertPidakaSchema, insertBurnSchema } from "@shared/schema";
import { generateAnonymousName } from "@shared/names";
import { log } from "./index";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set");
}
const JWT_SECRET = process.env.SESSION_SECRET;

async function uniqueAnonymousName(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const name = generateAnonymousName();
    const taken = await storage.getUserByAnonymousName(name);
    if (!taken) return name;
  }
  return `${generateAnonymousName()} ${Date.now().toString(36).slice(-3)}`;
}

async function publicUser(userId: string, fallback: {
  anonymousName: string;
  burnsSentCount: number;
  burnsReceivedCount: number;
}) {
  const unreadCount = await storage.countUnreadBurns(userId);
  return { ...fallback, unreadCount };
}

interface AuthRequest extends Request {
  userId?: string;
}

function viewerIdFrom(req: AuthRequest): string | undefined {
  if (req.userId) return req.userId;
  const header = req.headers["x-pidaka-viewer"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw && /^[a-zA-Z0-9_-]{8,64}$/.test(raw)) return raw;
  return undefined;
}

function pidakaParam(req: Request): string | undefined {
  const value = req.params.pidakaId ?? req.params.id;
  return Array.isArray(value) ? value[0] : value;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch {
      // Public read still works with a stale token.
    }
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const anonymousName = await uniqueAnonymousName();

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        anonymousName,
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      return res.status(201).json({
        token,
        user: await publicUser(user.id, {
          anonymousName: user.anonymousName,
          burnsSentCount: user.burnsSentCount,
          burnsReceivedCount: user.burnsReceivedCount,
        }),
      });
    } catch (err: any) {
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      return res.json({
        token,
        user: await publicUser(user.id, {
          anonymousName: user.anonymousName,
          burnsSentCount: user.burnsSentCount,
          burnsReceivedCount: user.burnsReceivedCount,
        }),
      });
    } catch (err: any) {
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(await publicUser(user.id, {
        anonymousName: user.anonymousName,
        burnsSentCount: user.burnsSentCount,
        burnsReceivedCount: user.burnsReceivedCount,
      }));
    } catch {
      return res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.get("/api/pidakas", optionalAuth as any, async (req: AuthRequest, res: Response) => {
    try {
      const viewerId = viewerIdFrom(req);
      const activePidakas = await storage.getActivePidakas();
      const seenIds = viewerId ? await storage.getSeenIds(viewerId) : [];
      const seenSet = new Set(seenIds);
      const witnessCounts = await storage.getWitnessCounts();
      const queuedIds = queueForViewer({
        items: activePidakas.map((p) => ({
          id: p.id,
          creatorId: p.creatorUserId,
          createdAt: p.createdAt,
          expiresAt: p.expiresAt,
        })),
        viewerId: viewerId ?? "__anon__",
        seenIds,
        witnessCounts,
      });
      const byId = new Map(activePidakas.map((p) => [p.id, p]));
      const queued = queuedIds
        .map((id) => byId.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
      const queuedIdSet = new Set(queued.map((p) => p.id));
      const own = viewerId
        ? activePidakas.filter((p) => p.creatorUserId === viewerId && !queuedIdSet.has(p.id))
        : [];
      const ordered = [...queued, ...own];
      return res.json(ordered.map((p) => ({
        id: p.id,
        content: p.content,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
        isOwn: viewerId ? p.creatorUserId === viewerId : false,
        seen: seenSet.has(p.id),
      })));
    } catch {
      return res.status(500).json({ message: "Failed to fetch pidakas" });
    }
  });

  app.post("/api/pidakas/:id/seen", optionalAuth as any, async (req: AuthRequest, res: Response) => {
    try {
      const viewerId = viewerIdFrom(req);
      if (!viewerId) {
        return res.status(400).json({ message: "Viewer required" });
      }
      const pidakaId = pidakaParam(req);
      if (!pidakaId) {
        return res.status(400).json({ message: "Pidaka id is required" });
      }
      const pidaka = await storage.getPidaka(pidakaId);
      if (!pidaka) {
        return res.status(404).json({ message: "Pidaka not found" });
      }
      if (pidaka.creatorUserId !== viewerId) {
        await storage.markSeen(pidakaId, viewerId);
      }
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ message: "Failed to mark seen" });
    }
  });

  app.post("/api/pidakas", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const parsed = insertPidakaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const pidaka = await storage.createPidaka(parsed.data.content, req.userId!);
      return res.status(201).json({
        id: pidaka.id,
        content: pidaka.content,
        createdAt: pidaka.createdAt,
        expiresAt: pidaka.expiresAt,
      });
    } catch {
      return res.status(500).json({ message: "Failed to create pidaka" });
    }
  });

  app.post("/api/burn/:pidakaId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const parsed = insertBurnSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const pidakaId = pidakaParam(req);
      if (!pidakaId) {
        return res.status(400).json({ message: "Pidaka id is required" });
      }

      const pidaka = await storage.getPidaka(pidakaId);
      if (!pidaka) {
        return res.status(404).json({ message: "Pidaka not found" });
      }

      if (pidaka.creatorUserId === req.userId) {
        return res.status(400).json({ message: "You cannot burn your own pidaka" });
      }

      const burn = await storage.createBurn(
        pidakaId,
        req.userId!,
        pidaka.creatorUserId,
        parsed.data.message
      );
      await storage.markSeen(pidakaId, req.userId!);

      return res.status(201).json({ id: burn.id, createdAt: burn.createdAt });
    } catch {
      return res.status(500).json({ message: "Failed to send burn" });
    }
  });

  app.get("/api/burns/inbox", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const inbox = await storage.getUserBurnsInbox(req.userId!);
      const safeInbox = inbox.map((b) => ({
        id: b.id,
        message: b.message,
        createdAt: b.createdAt,
        readAt: b.readAt,
        pidakaExcerpt: b.pidakaExcerpt,
      }));
      return res.json(safeInbox);
    } catch {
      return res.status(500).json({ message: "Failed to fetch inbox" });
    }
  });

  app.post("/api/burns/inbox/read", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      await storage.markBurnsRead(req.userId!);
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ message: "Failed to mark burns read" });
    }
  });

  cron.schedule("*/30 * * * *", async () => {
    try {
      await storage.deleteExpiredPidakas();
      log("Expired pidakas cleaned up", "cron");
    } catch (err) {
      log("Failed to clean up expired pidakas", "cron");
    }
  });

  return httpServer;
}
