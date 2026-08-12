# Resavvy Music Platform: Developer Technical Reference & Prompt Evolution Guide

This document serves as the comprehensive developer changelog, technical documentation, and Google AI Studio prompt evolution guide for **Resavvy Music Platform**. It captures every major development milestone, architecture decision, prompt instruction, and technical implementation details from initial build to the present state.

---

## 1. Executive Summary & Architecture Vision

**Resavvy Music Platform** is a full-stack, browser-based streaming music web application built with a client-first responsive interface, background YouTube audio streaming engine, parametric equalizer, track crossfade engine, offline PWA capabilities, social playlist curation, and a comprehensive admin management console.

### Key Architectural Pillars
- **Zero-Ad Background YouTube Audio Engine**: Custom YouTube iframe integration executing invisible audio streaming with custom volume scaling, EQ gains, and crossfade fading loops.
- **Parametric 5-Band Audio Equalizer**: Real-time gain control across 60Hz, 230Hz, 910Hz, 4kHz, and 14kHz bands paired with dynamic visual canvas representations and active sound presets.
- **Seamless Crossfade Engine**: Configurable track boundary blending (2s, 4s, 6s, 8s, 12s) with volume curve interpolation.
- **Offline PWA & Local Caching**: Progressive Web App architecture with offline indicator badges, local audio state tracking, and service worker caching.
- **Full Social & Curation Ecosystem**: User authentication, public user profiles, playlist cloning, tag-based shelves, public URL sharing, and local JSON playlist backup/restore.
- **Enterprise Admin Console**: In-depth analytics, daily quota tracking, automated dead-link scanning, promo banner slide creation (Desktop & Mobile viewports), system notifications, and user moderation.

---

## 2. Technology Stack Overview

| Layer | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite | Single-page application runtime & fast dev build engine |
| **Language** | TypeScript | Strict type safety across client and server |
| **Styling & UI** | Tailwind CSS, Framer Motion | Utility-first styling, glassmorphism, responsive animations |
| **Iconography** | Lucide React | Modern, cohesive UI vector icons |
| **Backend Runtime** | Express.js (Node.js) | Full-stack API proxy, authentication middleware, and static serving |
| **Database & ORM** | PostgreSQL, Prisma ORM | Relational data persistence for users, playlists, songs, logs, and config |
| **Audio Playback** | YouTube IFrame Player API | Multi-source streaming audio backend |
| **PWA Infrastructure** | Service Workers, Web Manifest | Offline asset caching and app installation support |

---

## 3. Comprehensive Google AI Studio Prompt Evolution Log

### Milestone 1: Initial Application Foundation & YouTube Audio Pipeline
* **User Prompt Intent**: *"Build a browser-based YouTube music streaming application with persistent player controls, track search, queue state, and a full-stack Express + Vite architecture."*
* **Architectural Strategy**:
  - Established custom full-stack architecture using Express backend (`server.ts`) with Vite middleware.
  - Built an invisible YouTube iframe wrapper (`HiddenYouTubePlayer.tsx`) capable of running behind custom React audio UI.
  - Constructed global React context wrappers (`PlayerContext.tsx`, `PlaylistContext.tsx`) for global playback state management.
* **Key Components**: `HiddenYouTubePlayer.tsx`, `PlayerBar.tsx`, `GlobalSearchBar.tsx`, `PlayerContext.tsx`.

---

### Milestone 2: Playlist Curation, Tagging, Social Sharing & Cloning
* **User Prompt Intent**: *"Add support for custom user playlists, track tagging, cloning playlists, liking tracks, and public playlist link sharing."*
* **Architectural Strategy**:
  - Implemented backend Prisma schema models for `User`, `Playlist`, `Song`, and `SavedPlaylist`.
  - Built `PlaylistHero.tsx`, `Tracklist.tsx`, and `PlaylistCard.tsx` with responsive layout grids and action menus.
  - Added public sharing routes (`PublicPlaylistPage.tsx`) and public curator profiles (`PublicProfilePage.tsx`).
* **Key Components**: `PlaylistHero.tsx`, `Tracklist.tsx`, `PublicPlaylistPage.tsx`, `PublicProfilePage.tsx`, `usePlaylistData.ts`.

---

### Milestone 3: Progressive Web App (PWA) & Offline Sync Indicators
* **User Prompt Intent**: *"Add Progressive Web App functionality with service worker caching, offline indicator badges, and install prompts."*
* **Architectural Strategy**:
  - Registered web application manifest (`manifest.json`) and service worker (`sw.js`).
  - Added `OfflineIndicator.tsx` to notify users of network connectivity and offline audio caching status.
  - Integrated cached track visual indicators (`CheckCircle2`) within song rows in `Tracklist.tsx`.
* **Key Components**: `OfflineIndicator.tsx`, `Tracklist.tsx`, `public/manifest.json`, `public/sw.js`.

---

### Milestone 4: Admin Management Console & Promo Slideshow Engine
* **User Prompt Intent**: *"Build an Admin Dashboard with user role management, dead-link scanning, system metrics, and promotional banner slideshow configuration."*
* **Architectural Strategy**:
  - Developed multi-tab `AdminDashboard.tsx` (Users, Playlists, Dead Link Scanner, Quota & API Analytics, Promo Slides, System Broadcasts).
  - Built promo slide manager with dual viewport preview support (Desktop `1200×400px` and Mobile `600×350px`).
  - Added API quota monitoring and system notification engine.
* **Key Components**: `AdminDashboard.tsx`, `api/admin.ts`, `AnalyticsDashboard.tsx`.

---

### Milestone 5: Audio Equalizer Suite & Ambient Fullscreen Player
* **User Prompt Intent**: *"Design a 5-band dynamic audio equalizer with preset controls and a full-screen ambient player modal."*
* **Architectural Strategy**:
  - Built `AudioEqualizerSuite.tsx` managing 5 audio frequency sliders (60Hz, 230Hz, 910Hz, 4kHz, 14kHz) with presets (General, Bass Boost, Pop, Rock, Vocal Boost, Acoustic).
  - Designed `FullscreenPlayer.tsx` featuring real-time ambient image blur, dynamic spectrum canvas, and expandable side panel for Queue & EQ views.
* **Key Components**: `AudioEqualizerSuite.tsx`, `FullscreenPlayer.tsx`.

---

### Milestone 6: Fullscreen Player Panel Polish & Icon-Only Controls
* **User Prompt Intent**:
  1. *"Create a panel that can be expanded and collapsed without using text labels; ensure it matches the style and dimensions indicated by the green box, keeping expand/collapse information accessible only via hover tooltip."*
  2. *"Refine visuals for the side section, fix empty space in the lower area, fix scrollbars for audio presets, and change text 'General (Flat)' to 'General'."*
  3. *"Use only icons for Minimize Player and Hide Panel without box borders, default desktop to Hide Panel, and maintain full-screen mobile scrolling."*
* **Architectural Strategy**:
  - Replaced text buttons with icon-only controls (`ChevronDown` for player minimize, `PanelRight` / `PanelRightClose` for side panel toggle) with clean hover tooltips.
  - Set default state `isSidePanelOpen = false` on desktop.
  - Adjusted container CSS classes in `FullscreenPlayer.tsx` to support auto height and smooth overflow without horizontal scrollbars.
  - Updated preset title in `AudioEqualizerSuite.tsx` from "General (Flat)" to "General" and removed ugly scrollbar styling via `no-scrollbar`.
* **Key Components**: `FullscreenPlayer.tsx`, `AudioEqualizerSuite.tsx`.

---

### Milestone 7: Visual Theme & Status Badge Consistency
* **User Prompt Intent**: *"Change the color of the green checkmark badge to match the color of the website theme (indigo), while keeping domain-appropriate status badges aligned."*
* **Architectural Strategy**:
  - Replaced `text-emerald-500` offline track checkmarks in `Tracklist.tsx` with theme-consistent `text-indigo-500` / `text-indigo-400`.
  - Reverted active sound engine and PWA status badges in `AudioEqualizerSuite.tsx` and `OfflineIndicator.tsx` to emerald green to clearly represent live status indicators.
* **Key Components**: `Tracklist.tsx`, `AudioEqualizerSuite.tsx`, `OfflineIndicator.tsx`.

---

### Milestone 8: Track Crossfade Transition Engine
* **User Prompt Intent**: *"Add a crossfade option in the settings menu to create smooth transitions between tracks during playback."*
* **Architectural Strategy**:
  - Added `crossfade` property (default `0s`, options: `Off`, `2s`, `4s`, `6s`, `8s`, `12s`) to `useSettings.ts` with local storage persistence.
  - Added interactive crossfade option controls in `SettingsScreen.tsx`.
  - Implemented continuous interval loop in `HiddenYouTubePlayer.tsx` that monitors track duration remaining, mathematically computes volume fade ratio during boundary windows, and automatically queues the next track.
* **Key Components**: `useSettings.ts`, `SettingsScreen.tsx`, `HiddenYouTubePlayer.tsx`.

---

### Milestone 9: Playlist Backup & Restore Engine (JSON Export & Import)
* **User Prompt Intent**: *"Add a feature to export current playlist metadata to a local JSON file in settings to back up curated track collections, and include an import feature to restore backups."*
* **Architectural Strategy**:
  - Implemented `handleExportData` in `SettingsScreen.tsx` generating formatted JSON files containing playlist metadata, track details, tags, and settings (`resavvy_playlists_backup_YYYY-MM-DD.json`).
  - Added `importPlaylists()` method to `usePlaylistData.ts` and `PlaylistContext.tsx` with payload validation, UUID collision prevention, track array cleaning, and server DB syncing.
  - Integrated `Upload` and `Download` buttons in `SettingsScreen.tsx` with file upload handlers and user toast feedback.
* **Key Components**: `SettingsScreen.tsx`, `usePlaylistData.ts`, `PlaylistContext.tsx`.

---

### Milestone 10: Bulk YouTube Playlist Import Engine (Phase 1)
* **User Prompt Intent**: *"Regarding the 'Add New Song' feature, is it possible to add songs in bulk from a YouTube playlist link instead of inputting them one by one? Lets execute Phase 1."*
* **Architectural Strategy**:
  - Developed server-side endpoint `/api/search/youtube-playlist` capable of parsing YouTube playlist URLs (`list=PL...`), extracting both `lockupViewModel` and legacy `playlistVideoRenderer` video nodes.
  - Implemented intelligent title and artist cleaning logic (`cleanTitleAndArtist`) to automatically extract clean artist names and titles from YouTube video headings.
  - Extended `src/utils/youtube.ts` with `extractYouTubePlaylistId(url)` regex detection.
  - Created interactive bulk playlist staging interface in `AddSongInput.tsx` featuring playlist track preview, select all/deselect all toggles, track search filter, editable inline title/artist inputs, and duration badges.
  - Added `addSongsBulk` method in `usePlaylistData.ts` and `PlaylistContext.tsx` for atomic batch persistence with duplicate protection and playlist capacity validation.
* **Key Components**: `api/search/youtube-playlist.ts`, `AddSongInput.tsx`, `usePlaylistData.ts`, `PlaylistContext.tsx`, `AppLayout.tsx`.

---

### Milestone 11: Create New Playlist directly from YouTube Playlist Link (Phase 2)
* **User Prompt Intent**: *"Lets continue execute Phase 2"*
* **Architectural Strategy**:
  - Updated `createGroup` in `usePlaylistData.ts` and `PlaylistContext.tsx` to support optional `initialSongs` parameter and return the newly created `PlaylistGroup`.
  - Built a dedicated modal `CreatePlaylistModal.tsx` featuring tabbed navigation ("Blank Playlist" vs. "Import YouTube Playlist").
  - Automated YouTube playlist metadata extraction: pasting a YouTube playlist link auto-populates the playlist name, description, tags, and stages all extracted video tracks with inline artist/title editing, duration displays, and select all/deselect all toggles.
  - Integrated seamless navigation after creation: creating an imported playlist automatically sets the newly generated playlist as active and loads all tracks immediately.
* **Key Components**: `CreatePlaylistModal.tsx`, `usePlaylistData.ts`, `PlaylistContext.tsx`, `AppLayout.tsx`.

---

### Milestone 12: Global Search Bar YouTube Playlist & Video Link Auto-Detection (Phase 3)
* **User Prompt Intent**: *"Lets continue execute Phase 3"*
* **Architectural Strategy**:
  - Enhanced `GlobalSearchBar.tsx` with real-time regex URL detection for both YouTube playlist and video links.
  - Integrated instant visual quick-action cards in the top search dropdown:
    - **YouTube Playlist Link Card**: Offers instant one-click actions: "Import as New Playlist" (opens `CreatePlaylistModal` pre-populated with URL and auto-fetching playlist tracks) and "Add to Current Playlist" (opens `AddSongInput` pre-populated with URL).
    - **YouTube Video Link Card**: Offers instant actions: "Add Song to Playlist" and "Create Playlist with Track".
  - Connected `TopNav.tsx` and `AppLayout.tsx` state pipelines to seamlessly forward pre-filled URLs directly to modals upon detection card interaction.
* **Key Components**: `GlobalSearchBar.tsx`, `TopNav.tsx`, `AppLayout.tsx`, `AddSongInput.tsx`, `CreatePlaylistModal.tsx`.

---

### Milestone 13: PostgreSQL Database Connection Auto-Recovery & Error Handling
* **User Prompt Intent**: *"Fix the errors in the app - prisma:error Error in PostgreSQL connection: Error { kind: Closed, cause: None }"*
* **Architectural Strategy**:
  - Built a resilient Proxy wrapper around the Prisma client (`src/lib/prisma.ts`) that intercepts all model queries and raw transactions.
  - Implemented automatic retry logic with exponential backoff and transparent `$disconnect()` / `$connect()` reconnection whenever PostgreSQL connection drops or closes due to remote idle timeouts (`Error { kind: Closed }`, `P1001`, `P1017`).
  - Wrapped server API route handlers in `server.ts` with an async error handler to catch unexpected exceptions cleanly without dropping connections.
* **Key Components**: `src/lib/prisma.ts`, `server.ts`.

---

### Milestone 14: API Route Sub-path Matching & Safe JSON Fallback
* **User Prompt Intent**: *"Fix the errors in the app - Unexpected token '<', '<!doctype '... is not valid JSON"*
* **Architectural Strategy**:
  - Updated Express API route definitions in `server.ts` to cover sub-paths and trailing slashes (`["/api/playlists", "/api/playlists/*"]`).
  - Added a dedicated `/api/*` Express catch-all 404 handler before Vite dev server middleware to ensure any unmatched API route returns a JSON 404 object instead of falling through to Vite's SPA HTML index fallback.
  - Hardened frontend fetch handlers in `usePlaylistData.ts` and `HomeDashboard.tsx` to safely inspect HTTP status and `Content-Type` headers before parsing JSON.
* **Key Components**: `server.ts`, `src/hooks/usePlaylistData.ts`, `src/components/HomeDashboard.tsx`.

---

### Milestone 15: Fix Song Dropdown Menu Stacking Context & Opaque Styling
* **User Prompt Intent**: *"The drop-down option on the song is obstructed by another element and cannot be clicked; please fix this."*
* **Architectural Strategy**:
  - Identified that virtualized list item container `<div>` wrappers (`position: absolute`) lacked explicit `zIndex`, causing subsequent track rows in the DOM to stack on top of earlier rows' opened dropdown menus.
  - Added `openMenuSongId` state in `Tracklist.tsx` to elevate the active song row's virtual wrapper container `div` to `zIndex: 100`.
  - Upgraded the song action dropdown menu (`.song-menu-dropdown`) and `QuickAddMenu` styling from semi-transparent (`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl`) to solid opaque (`bg-white dark:bg-gray-900 shadow-2xl z-[110]`), completely preventing row content behind the menu from bleeding through or obstructing user clicks.
* **Key Components**: `src/components/Tracklist.tsx`, `src/components/QuickAddMenu.tsx`.

---

## 4. Subsystem Technical Deep Dives

### A. YouTube Audio & Equalizer Pipeline (`HiddenYouTubePlayer.tsx`)
```
[React Player Context State] 
       │
       ▼
[HiddenYouTubePlayer (IFrame Wrapper)] ◄─── [Crossfade Engine Loop (200ms Interval)]
       │
       ├─ Volume Scaler (0-100%)
       ├─ Crossfade Fade-In/Fade-Out Multiplier
       └─ Equalizer Frequency Gain Maps
```

- **Audio Control Mechanism**: Standard YouTube IFrame API lacks native multi-band EQ filters. We emulate parametric gain controls by manipulating output volume dynamics, software filter approximations, and gain scaling in real-time.
- **Volume Curve Calculation**: During crossfade windows:
  $$\text{Fade Ratio} = \frac{\text{Time Remaining}}{\text{Crossfade Seconds}}$$
  $$\text{Effective Volume} = \text{User Volume} \times \text{Fade Ratio}$$

### B. Backup & Restore Schema Format (`JSON`)
When exported, playlists follow this normalized JSON structure:
```json
{
  "app": "ReSavvy Music",
  "version": 1,
  "exportedAt": "2026-08-10T15:35:00.000Z",
  "playlistCount": 3,
  "playlists": [
    {
      "id": "c3a2f8e1-...",
      "name": "Lo-Fi Focus Sessions",
      "description": "Chill beats for deep work",
      "tags": ["lofi", "study", "chill"],
      "visibility": "public",
      "coverType": "gradient",
      "songs": [
        {
          "id": "song-1",
          "youtubeId": "5qap5aO4i9A",
          "title": "Lofi Hip Hop Radio",
          "artist": "Lofi Girl",
          "thumbnailUrl": "https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg",
          "duration": "3:45"
        }
      ]
    }
  ]
}
```

---

## 5. Prisma Database Schema Summary

The database uses PostgreSQL with Prisma ORM (`prisma/schema.prisma`):

```
+------------------+         +--------------------+         +-----------------+
|       User       | 1     * |      Playlist      | 1     * |      Song       |
+------------------+ <-----> +--------------------+ <-----> +-----------------+
| id (UUID)        |         | id (UUID)          |         | id (UUID)       |
| username (UQ)    |         | userId (FK)        |         | playlistId (FK) |
| passwordHash     |         | name               |         | youtubeId       |
| role             |         | visibility         |         | title, artist   |
| status           |         | likesCount         |         | duration        |
+------------------+         +--------------------+         +-----------------+
         ^                             ^
         |                             |
         +------ [SavedPlaylist] ------+ (Many-to-Many join table for saved playlists)
```

---

## 6. Guide for Future Developers Rebuilding This Platform

To rebuild or extend this application from scratch:

1. **Setup Node Environment & Prisma DB**:
   - Run `npm install`
   - Configure `.env` with `DATABASE_URL="postgresql://user:pass@localhost:5432/resavvy"`
   - Execute `npx prisma db push` to synchronize database tables.

2. **Run Dev Server**:
   - `npm run dev` boots the Express backend on port `3000` with integrated Vite middleware.

3. **Production Build**:
   - `npm run build` compiles frontend assets to `dist/` and server TypeScript via esbuild to `dist/server.cjs`.
   - Launch with `npm start`.

---
*Documentation updated & maintained for AI Studio build consistency.*
