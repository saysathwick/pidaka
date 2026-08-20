import "./env";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { isDemoMode } from "./db";
import { ensureSchema } from "./ensure-schema";
import { adminSecret } from "./admin";
import { securityHeaders } from "./http-security";
import { migrateVault } from "./vault";

const app = express();
const httpServer = createServer(app);
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(securityHeaders);

app.use(
  express.json({
    limit: "32kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "8kb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  if (!isDemoMode) {
    try {
      await ensureSchema();
      log("postgres schema ready");
      await migrateVault();
    } catch (err) {
      console.error("postgres is not reachable or schema could not be created", err);
      process.exit(1);
    }
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Serve API + client on the host-provided PORT (default 5000).
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    if (isDemoMode) {
      log("no DATABASE_URL — running in-memory demo wall", "demo");
    }
    if (!process.env.ADMIN_SECRET?.trim()) {
      if (adminSecret()) {
        log("ADMIN_SECRET unset — local hearth key is SESSION_SECRET + ':hearth'", "hearth");
      } else {
        log("ADMIN_SECRET is unset — /hearth is locked", "hearth");
      }
    }
  });
})();
