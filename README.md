# Resavvy – Music Library & Curation Platform

Resavvy is a premium, browser-based YouTube music library, PWA audio player, and curation platform. It allows users to easily search, organize, curate, and share their favorite YouTube tracks with a polished, native-feeling user experience.

---

## Technical Specifications & Asset Optimization Guide

This section outlines technical specifications, media asset requirements, and optimization strategies to ensure optimal visual presentation and web performance across desktop and mobile devices.

### 1. YouTube Thumbnail Optimization (`getThumbnailUrl`)

To maintain fast page load times, lower bandwidth consumption, and minimize Cumulative Layout Shift (CLS), YouTube video thumbnails are fetched using an optimized resolution utility `getThumbnailUrl(videoId, size)`.

#### Available Resolution Sizes:
| Size Parameter | Resolution | Aspect Ratio | Use Case |
| :--- | :--- | :--- | :--- |
| `default` | 120 × 90 px | 4:3 | Compact list items, small popovers, & search previews |
| `mqdefault` / `mq` | 320 × 180 px | 16:9 | **Standard Default**: Song cards, grid views, tracklists, bottom player bar, & background overlays |
| `hqdefault` / `hq` | 480 × 360 px | 4:3 | High-density retina previews & modal covers |
| `sddefault` / `sd` | 640 × 480 px | 4:3 | Standard-definition playlist header banners |
| `maxresdefault` / `maxres` | 1280 × 720 px | 16:9 | Immersive full-screen background visualizers & hero banners |

> **Performance Strategy**: By standardizing grid and list view thumbnails to `mqdefault` (320x180 px), initial page payloads are reduced by up to 70% compared to uncompressed `maxresdefault` images, providing near-instant loading even on constrained mobile networks.

---

### 2. Promotional Banners & Ad Unit Specifications

Administrators can deploy system-wide promotional banners, sponsorship slides, and advertisement units via the **Promotions & Broadcasts** panel in the Admin Dashboard.

#### Banner Image Dimensions & Aspect Ratios:
* **Desktop Banner**:
  * **Recommended Dimensions**: `1200 × 400 pixels`
  * **Aspect Ratio**: `3:1` (1200/400)
  * **Display Location**: Hero carousel on desktop home feeds.
* **Mobile Banner**:
  * **Recommended Dimensions**: `600 × 350 pixels`
  * **Aspect Ratio**: `~1.71:1` (600/350)
  * **Display Location**: Mobile home feed carousel.
  * **Fallback Behavior**: If a dedicated mobile image URL is omitted, the desktop banner image automatically scales to fit mobile displays.

#### Administrator Customization Options:
* **Gradient Overlay (`enableGradient`)**: Toggles a dark readability gradient behind overlay text.
* **Hide Content (`hideContent`)**: Hides text overlays and action buttons to display full graphical/banner artwork cleanly.
* **Call-to-Action**: Custom button label and target destination URL.
* **Real-time Live Preview**: Real-time aspect ratio preview toggle (Desktop `1200x400` vs Mobile `600x350`) in the Admin Dashboard before publishing changes system-wide.

---

### 3. PWA Icons & SEO Meta Assets

Located in the `/public` directory and configured in `index.html`:
* **App Icon (Small)**: `192 × 192 px` PNG (`/public/icon-192.png`)
* **App Icon (Large)**: `512 × 512 px` PNG (`/public/icon-512.png`)
* **Apple Touch Icon**: `180 × 180 px` PNG (`/public/apple-touch-icon.png`)
* **Open Graph / Twitter Card Image**: `1200 × 630 px` JPG/PNG

---

## Key Features

- **YouTube Search & Discovery**: Real-time track search, metadata extraction, and smooth playback streaming.
- **Custom Playlists & Social Curation**: Tag, like, clone, and share public playlists.
- **Progressive Web App (PWA)**: Complete offline support capabilities, service worker, custom app manifest, and native standalone experience.
- **Stately Audio Interface**: Smooth full-screen player, custom audio equalizer, queue control, and dynamic visualizer.
- **Rich Analytics & Administration**: Dashboard monitoring, user role management, content moderation, dead-link detection, and homepage section customization.

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
