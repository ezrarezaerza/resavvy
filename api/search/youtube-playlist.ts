import type { Request, Response } from 'express';
import { recordQuotaUsage } from '../admin/helpers.js';

function parseDurationString(labelStr?: string): string {
  if (!labelStr) return "--:--";
  if (labelStr.match(/(\d+)\s*minutes?/i)) {
    const minMatch = labelStr.match(/(\d+)\s*minutes?/i);
    const secMatch = labelStr.match(/(\d+)\s*seconds?/i);
    const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
    const secs = secMatch ? parseInt(secMatch[1], 10) : 0;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return "--:--";
}

function cleanTitleAndArtist(rawTitle: string, fallbackArtist: string = "Unknown Artist") {
  if (!rawTitle) return { title: "Unknown Title", artist: fallbackArtist };
  
  let cleaned = rawTitle.replace(/official(?: music)? video|lyric(?:s| video)?|m\/v/gi, "").trim();
  cleaned = cleaned.replace(/\(\s*\)|\[\s*\]/g, "").trim();
  cleaned = cleaned.replace(/-+$/, "").trim();

  if (cleaned.includes(" - ")) {
    const parts = cleaned.split(" - ");
    return {
      artist: parts[0].trim() || fallbackArtist,
      title: parts.slice(1).join(" - ").trim() || "Unknown Title"
    };
  } else if (cleaned.includes("-")) {
    const parts = cleaned.split("-");
    return {
      artist: parts[0].trim() || fallbackArtist,
      title: parts.slice(1).join("-").trim() || "Unknown Title"
    };
  }
  return {
    artist: fallbackArtist !== "Unknown Artist" ? fallbackArtist : "Unknown Artist",
    title: cleaned || "Unknown Title"
  };
}

export function extractPlaylistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const match = urlOrId.match(/(?:list=)([\w-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Check if raw ID is passed (e.g. PLzrsd1pThxX1iarQAENm8PGPcth2az9-i)
  if (/^PL[\w-]+$/i.test(urlOrId.trim())) {
    return urlOrId.trim();
  }
  return null;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url, listId: reqListId } = req.query;
    const input = (url || reqListId) as string;

    if (!input) {
      return res.status(400).json({ error: 'Query parameter "url" or "listId" is required' });
    }

    const listId = extractPlaylistId(input);
    if (!listId) {
      return res.status(400).json({ error: 'Invalid YouTube Playlist URL or ID' });
    }

    // Record YouTube API quota usage
    await recordQuotaUsage(100);

    const playlistUrl = `https://www.youtube.com/playlist?list=${listId}`;
    const htmlRes = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!htmlRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch playlist page from YouTube' });
    }

    const html = await htmlRes.text();
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

    let data: any = null;
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (match) {
      try { data = JSON.parse(match[1]); } catch(e) {}
    }

    if (!data && apiKey) {
      const browseRes = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          browseId: "VL" + listId,
          context: { client: { clientName: "WEB", clientVersion: "2.20240215.00.00", hl: "en", gl: "US" } }
        })
      });
      if (browseRes.ok) {
        data = await browseRes.json();
      }
    }

    if (!data) {
      return res.status(404).json({ error: 'Unable to parse YouTube playlist data' });
    }

    const playlistTitle = data?.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text || 
                          data?.metadata?.playlistMetadataRenderer?.title || 
                          "Imported YouTube Playlist";

    const songs: Array<{ id: string; title: string; artist: string; thumbnailUrl: string; duration: string }> = [];
    const seenIds = new Set<string>();

    function walk(obj: any) {
      if (!obj || typeof obj !== "object") return;

      // Lockup ViewModel format
      if (obj.lockupViewModel && obj.lockupViewModel.contentId && obj.lockupViewModel.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
        const vm = obj.lockupViewModel;
        const id = vm.contentId;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          const rawTitle = vm.metadata?.lockupMetadataViewModel?.title?.content || "Unknown Title";
          let rawArtist = vm.metadata?.lockupMetadataViewModel?.metadataText?.content || "Unknown Artist";
          if (rawArtist.includes("•")) rawArtist = rawArtist.split("•")[0].trim();
          const accessLabel = vm.rendererContext?.accessibilityContext?.label || "";
          const dur = parseDurationString(accessLabel);

          const { title, artist } = cleanTitleAndArtist(rawTitle, rawArtist);

          songs.push({
            id,
            title,
            artist,
            thumbnailUrl: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
            duration: dur
          });
        }
      }

      // Legacy Playlist Video Renderer format
      if (obj.playlistVideoRenderer) {
        const pvr = obj.playlistVideoRenderer;
        const id = pvr.videoId;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          const rawTitle = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText || "Unknown Title";
          const rawArtist = pvr.shortBylineText?.runs?.[0]?.text || "Unknown Artist";
          const durSecs = pvr.lengthSeconds ? parseInt(pvr.lengthSeconds, 10) : 0;
          const dur = durSecs ? `${Math.floor(durSecs / 60)}:${(durSecs % 60).toString().padStart(2, "0")}` : "--:--";

          const { title, artist } = cleanTitleAndArtist(rawTitle, rawArtist);

          songs.push({
            id,
            title,
            artist,
            thumbnailUrl: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
            duration: dur
          });
        }
      }

      for (const k of Object.keys(obj)) {
        walk(obj[k]);
      }
    }

    walk(data);

    return res.status(200).json({
      title: playlistTitle,
      totalTracks: songs.length,
      songs
    });
  } catch (error: any) {
    console.error('YouTube Playlist API Error:', error);
    return res.status(500).json({ error: 'Failed to process YouTube playlist', details: error.message });
  }
}
