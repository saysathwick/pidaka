import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { htmlForRequest, pageStatus } from "./page-html";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use("/{*path}", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const html = htmlForRequest(fs.readFileSync(indexPath, "utf-8"), req);
    res.status(pageStatus(req.path)).set({ "Content-Type": "text/html" }).end(html);
  });
}
