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
