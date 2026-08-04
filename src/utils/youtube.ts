export type ThumbnailSize = 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' | 'mq' | 'hq' | 'sd' | 'maxres';

export function getThumbnailUrl(videoIdOrUrl: string, size: ThumbnailSize | string = 'mqdefault'): string {
  if (!videoIdOrUrl) return '';

  let videoId = videoIdOrUrl;

  if (videoIdOrUrl.includes('/') || videoIdOrUrl.includes('.')) {
    const ytImgMatch = videoIdOrUrl.match(/i\.ytimg\.com\/vi\/([a-zA-Z0-9_-]{11})/);
    if (ytImgMatch && ytImgMatch[1]) {
      videoId = ytImgMatch[1];
    } else {
      const extracted = extractYouTubeId(videoIdOrUrl);
      if (extracted) {
        videoId = extracted;
      } else {
        return videoIdOrUrl;
      }
    }
  }

  let resName = 'mqdefault';
  const cleanSize = size.toLowerCase().replace(/\.jpg$/, '');

  switch (cleanSize) {
    case 'default':
      resName = 'default';
      break;
    case 'mq':
    case 'mqdefault':
      resName = 'mqdefault';
      break;
    case 'hq':
    case 'hqdefault':
      resName = 'hqdefault';
      break;
    case 'sd':
    case 'sddefault':
      resName = 'sddefault';
      break;
    case 'maxres':
    case 'maxresdefault':
      resName = 'maxresdefault';
      break;
    default:
      resName = cleanSize || 'mqdefault';
      break;
  }

  return `https://i.ytimg.com/vi/${videoId}/${resName}.jpg`;
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export async function fetchYouTubeMetadata(url: string): Promise<{ title: string; thumbnailUrl: string }> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  try {
    // We encode the URL to safely pass it to noembed
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error("Network request failed");
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      title: data.title || "Unknown Title",
      thumbnailUrl: getThumbnailUrl(videoId, 'mqdefault'),
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to fetch video metadata");
  }
}

