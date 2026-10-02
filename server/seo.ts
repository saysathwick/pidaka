import type { Express } from "express";
import { INDEXABLE_PATHS } from "@shared/site";
import { requestOrigin } from "./page-html";

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    const origin = requestOrigin(req);
    const lines = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /hearth",
      "",
      `Sitemap: ${origin}/sitemap.xml`,
      "",
    ];
    res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(lines.join("\n"));
  });

  app.get("/sitemap.xml", (req, res) => {
    const origin = requestOrigin(req);
    const urls = INDEXABLE_PATHS.map(
      (path) => `  <url>\n    <loc>${origin}${path}</loc>\n  </url>`,
    ).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
    res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(xml);
  });
}
