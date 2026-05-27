import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Consolidated Routes
  app.all("/api/auth", (async (req: any, res: any) => {
    const handler = await import("./api/auth.js");
    return handler.default(req, res);
  }) as any);

  app.all("/api/playlists", (async (req: any, res: any) => {
    const handler = await import("./api/playlists.js");
    return handler.default(req, res);
  }) as any);

  app.all("/api/songs", (async (req: any, res: any) => {
    const handler = await import("./api/songs.js");
    return handler.default(req, res);
  }) as any);

  app.all("/api/social", (async (req: any, res: any) => {
    const handler = await import("./api/social.js");
    return handler.default(req, res);
  }) as any);

  app.all("/api/search/youtube", (async (req: any, res: any) => {
    const handler = await import("./api/search/youtube.js");
    return handler.default(req, res);
  }) as any);

  app.all("/api/search/global", (async (req: any, res: any) => {
    const handler = await import("./api/search/global.js");
    return handler.default(req, res);
  }) as any);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
