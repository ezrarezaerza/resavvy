# Resavvy – Music Library & Curation Platform

Resavvy is a premium, browser-based YouTube music library, PWA audio player, and curation platform. It allows users to easily search, organize, curate, and share their favorite YouTube tracks with a polished, native-feeling user experience.

---

## UI Layout & Media Display Specifications

To ensure a seamless visual presentation across devices, media assets and covers adapt dynamically according to viewport size, UI context, and device capabilities.

### 1. Song Cover & Track Artwork Display

YouTube song artwork is displayed using tailored visual dimensions and aspect ratios across different platform views:

| View Component | Aspect Ratio | Desktop Display Size | Mobile Display Size | Styling Details |
| :--- | :--- | :--- | :--- | :--- |
| **Grid Song Cards** (`SongCard.tsx`) | `1:1` Square | Responsive Grid Card (`aspect-square`) | Responsive Grid Card (`aspect-square`) | `rounded-xl` with drop-shadow & scale-up hover feedback |
| **Heavy Rotation Cards** (`HomeDashboard.tsx`) | `1:1` Square | `320 px` Card width with `64 × 64 px` Avatar | `80vw` Card width with `64 × 64 px` Avatar | Backdrop blur container (`rounded-2xl`) |
| **Standard Tracklists** (`Tracklist.tsx`) | `1:1` Square | `48 × 48 px` | `48 × 48 px` | Compact row artwork (`rounded-xl`) |
| **Explore & Discovery Rows** (`DiscoveryDashboard.tsx`) | `16:9` Rectangular | `64 × 48 px` Rectangular Crop | `64 × 48 px` Rectangular Crop | Widescreen format optimized for video preview frames |
| **Playlist Hero Covers** (`PlaylistHero.tsx`) | `1:1` Square | `224 × 224 px` to `256 × 256 px` | `176 × 176 px` | `rounded-3xl` with prominent `shadow-2xl` elevation |
| **Public Showcase Hero** (`PublicPlaylistPage.tsx`) | `1:1` Square | `240 × 240 px` | `192 × 192 px` | Centered showcase cover with `rounded-2xl` borders |
| **Bottom Player Bar** (`PlayerBar.tsx`) | `1:1` Square | `48 × 48 px` | `48 × 48 px` | Persistent compact album cover with `rounded-xl` |
| **Fullscreen Player Artwork** (`FullscreenPlayer.tsx`) | `1:1` Square | `320 × 320 px` (`w-80 h-80`) | `256 × 256 px` (`w-64 h-64`) | Elevated album cover with scaled `150%` ambient background blur |

---

### 2. Promotional Banners & Ad Unit Specifications

Administrators can deploy system-wide promotional banners, sponsorship slides, and advertisement units via the **Promotions & Broadcasts** panel in the Admin Dashboard.

#### Banner Image Dimensions & Responsive Display:
* **Desktop Banner**:
  * **Display Dimensions**: `1200 × 400 pixels`
  * **Aspect Ratio**: `3:1` (w-[1200px] aspect-[1200/400])
  * **Display Location**: Hero carousel on desktop home feeds.
* **Mobile Banner**:
  * **Display Dimensions**: `600 × 350 pixels`
  * **Aspect Ratio**: `~1.71:1` (w-[600px] aspect-[600/350])
  * **Display Location**: Mobile home feed carousel.
  * **Fallback Mechanism**: If a dedicated mobile image URL is omitted, the system automatically scales the desktop banner image to fit mobile screen widths.

#### Administrator Customization Controls:
* **Gradient Overlay (`enableGradient`)**: Toggles a dark readability gradient behind overlay text for contrast against vibrant artwork.
* **Hide Content (`hideContent`)**: Suppresses text overlays and action buttons to display raw graphical or brand artwork cleanly.
* **Interactive Call-to-Action**: Custom CTA button text and destination URL parameters.
* **Real-time Live Device Visualizer**: Allows administrators to toggle between **Desktop Preview (1200×400)** and **Mobile Preview (600×350)** inside the Admin Dashboard before publishing slides system-wide.

---

### 3. Global Broadcasts & System Announcement Banners

* **System Alert Banner**: Full-width top notification bar (`SYSTEM_ALERT_BANNER`, up to 180 characters) displayed across the entire platform. Users can dismiss it for their current session.
* **Maintenance Mode Banner**: Emergency top banner rendered across all user views when `SYSTEM_MAINTENANCE_MODE` is activated by an administrator.

---

### 4. Navigation & Workspace Layout Dimensions

* **Desktop Left Sidebar** (`Sidebar.tsx`): Fixed `256 px` (`w-64`) width with sticky positioning.
* **Top Navigation Bar** (`TopNav.tsx`): Fixed `64 px` (`h-16`) height with centered global search bar (`max-w-md` / `448 px`).
* **Mobile Bottom Navigation Bar** (`MobileBottomNav.tsx`): Fixed `64 px` (`h-16`) height with 5 primary touch tabs (`>44 px` touch targets).
* **PWA & Mobile Meta Assets**:
  * **App Icon (Small)**: `192 × 192 px` PNG (`/public/icon-192.png`)
  * **App Icon (Large)**: `512 × 512 px` PNG (`/public/icon-512.png`)
  * **Apple Touch Icon**: `180 × 180 px` PNG (`/public/apple-touch-icon.png`)
  * **Open Graph Preview**: `1200 × 630 px` JPG/PNG

---

## Core Features

- **YouTube Track Management & Metadata**: Real-time track search, title parsing, artist extraction, and streaming playback.
- **Custom Playlists & Social Curation**: Tagging, cloning, liking, and public playlist link sharing.
- **Progressive Web App (PWA)**: Service worker offline fallback, custom PWA manifest, install prompt, and native mobile container layout.
- **Stately Audio Player & Equalizer**: Persistent player bar, queue management, full-screen player with collapsible icon-only side-panel, custom 5-band audio equalizer presets, and dynamic ambient background visualizer.
- **Track Crossfade Transition Engine**: Smoothly blends audio track boundaries with configurable crossfade durations (Off, 2s, 4s, 6s, 8s, 12s) configured via Settings.
- **Playlist Backup & Restore (JSON Export/Import)**: Complete local JSON file export and import system in Settings for backing up and restoring curated track collections with automatic deduplication and server sync.
- **Comprehensive Admin Suite**: Public playlist moderation, dead-link checking, user role management, system broadcast alerts, and customizable promo banner slideshows.

---

## Technical Documentation & Prompt Changelog

For a comprehensive log of key development prompts, milestones, and architectural decisions made during the Google AI Studio build lifecycle, refer to [CHANGELOG.md](./CHANGELOG.md).

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application
```bash
npm run build
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Run the Production Server
```bash
npm start
```
