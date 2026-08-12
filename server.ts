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
import youtubePlaylistHandler from "./api/search/youtube-playlist.js";
import globalHandler from "./api/search/global.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Helper wrapper for async API handlers
  const asyncHandler = (fn: any) => async (req: any, res: any) => {
    try {
      await fn(req, res);
    } catch (err: any) {
      console.error(`[API Error] ${req.path}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Internal server error" });
      }
    }
  };

  // Consolidated Routes (including sub-paths and trailing slashes)
  app.all(["/api/auth", "/api/auth/*"], asyncHandler((req: any, res: any) => authHandler(req, res)));
  app.all(["/api/admin", "/api/admin/*"], asyncHandler((req: any, res: any) => adminHandler(req, res)));
  app.all(["/api/playlists", "/api/playlists/*"], asyncHandler((req: any, res: any) => playlistsHandler(req, res)));
  app.all(["/api/songs", "/api/songs/*"], asyncHandler((req: any, res: any) => songsHandler(req, res)));
  app.all(["/api/social", "/api/social/*"], asyncHandler((req: any, res: any) => socialHandler(req, res)));
  app.all(["/api/search/youtube-playlist", "/api/search/youtube-playlist/*"], asyncHandler((req: any, res: any) => youtubePlaylistHandler(req, res)));
  app.all(["/api/search/youtube", "/api/search/youtube/*"], asyncHandler((req: any, res: any) => youtubeHandler(req, res)));
  app.all(["/api/search/global", "/api/search/global/*"], asyncHandler((req: any, res: any) => globalHandler(req, res)));

  // Fallback for unhandled /api requests to prevent Vite SPA HTML fallback
  app.all("/api/*", (req: any, res: any) => {
    res.status(404).json({ error: `API route ${req.path} not found` });
  });

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
