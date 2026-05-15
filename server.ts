import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import registerHandler from "./api/auth/register.js";
import loginHandler from "./api/auth/login.js";
import publicFetchHandler from "./api/playlists/get.js";
import importPlaylistHandler from "./api/playlists/import.js";
import createPlaylistHandler from "./api/playlists/create.js";
import updatePlaylistHandler from "./api/playlists/update.js";
import addSongHandler from "./api/playlists/songs.js";
import getLibrarySongsHandler from "./api/library/songs.js";
import bulkAddSongsHandler from "./api/library/bulk.js";
import dedupeHandler from "./api/library/dedupe.js";
import exploreSongsHandler from "./api/explore/songs.js";
import toggleLikeHandler from "./api/songs/like.js";
import heavyRotationHandler from "./api/smart/heavy-rotation.js";
import trendingHandler from "./api/smart/trending.js";
import getLikedSongsHandler from "./api/library/liked.js";
import { authMiddleware, optionalAuthMiddleware } from "./api/middleware/auth.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API routes FIRST
  app.post("/api/auth/register", registerHandler);
  app.post("/api/auth/login", loginHandler);

  // Playlist Routes
  app.get("/api/playlists/:id", optionalAuthMiddleware as any, publicFetchHandler as any);
  app.post("/api/playlists/:id/import", authMiddleware as any, importPlaylistHandler as any);
  app.post("/api/playlists/:id/songs", authMiddleware as any, addSongHandler as any);
  app.post("/api/playlists", authMiddleware as any, createPlaylistHandler as any);
  app.put("/api/playlists/:id", authMiddleware as any, updatePlaylistHandler as any);

  // Library Routes
  app.get("/api/library/songs", authMiddleware as any, getLibrarySongsHandler as any);
  app.get("/api/library/liked", authMiddleware as any, getLikedSongsHandler as any);
  app.post("/api/library/bulk", authMiddleware as any, bulkAddSongsHandler as any);
  app.get("/api/library/dedupe", authMiddleware as any, dedupeHandler as any);
  app.post("/api/library/dedupe/merge", authMiddleware as any, dedupeHandler as any);

  // Explore Routes
  app.get("/api/explore/songs", authMiddleware as any, exploreSongsHandler as any);

  // Smart & Song Routes
  app.post("/api/songs/like", authMiddleware as any, toggleLikeHandler as any);
  app.get("/api/smart/heavy-rotation", authMiddleware as any, heavyRotationHandler as any);
  app.get("/api/smart/trending", authMiddleware as any, trendingHandler as any);

  // Discovery Route
  app.get("/api/discovery", authMiddleware as any, (async (req: any, res: any) => {
    const handler = await import("./api/discovery/index.js");
    return handler.default(req, res);
  }) as any);

  // User Profile Routes
  app.put("/api/users/update-profile", authMiddleware as any, (async (req: any, res: any) => {
    const handler = await import("./api/users/update-profile.js");
    return handler.default(req, res);
  }) as any);
  app.get("/api/users/:username", optionalAuthMiddleware as any, (async (req: any, res: any) => {
    const handler = await import("./api/users/profile.js");
    return handler.default(req, res);
  }) as any);

  // Analytics Route
  app.get("/api/analytics/stats", authMiddleware as any, (async (req: any, res: any) => {
    const handler = await import("./api/analytics/stats.js");
    return handler.default(req, res);
  }) as any);

  // Search Route
  app.get("/api/search/youtube", authMiddleware as any, (async (req: any, res: any) => {
    const handler = await import("./api/search/youtube.js");
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
