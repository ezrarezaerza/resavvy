import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import authHandler from "./api/auth.js";
import adminHandler from "./api/admin.js";
import playlistsHandler from "./api/playlists.js";
import songsHandler from "./api/songs.js";
import socialHandler from "./api/social.js";
import youtubeHandler from "./api/search/youtube.js";
import globalHandler from "./api/search/global.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Consolidated Routes
  app.all("/api/auth", (async (req: any, res: any) => {
    return authHandler(req, res);
  }) as any);

  app.all("/api/admin", (async (req: any, res: any) => {
    return adminHandler(req, res);
  }) as any);

  app.all("/api/playlists", (async (req: any, res: any) => {
    return playlistsHandler(req, res);
  }) as any);

  app.all("/api/songs", (async (req: any, res: any) => {
    return songsHandler(req, res);
  }) as any);

  app.all("/api/social", (async (req: any, res: any) => {
    return socialHandler(req, res);
  }) as any);

  app.all("/api/search/youtube", (async (req: any, res: any) => {
    return youtubeHandler(req, res);
  }) as any);

  app.all("/api/search/global", (async (req: any, res: any) => {
    return globalHandler(req, res);
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
