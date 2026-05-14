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

    // CRITICAL DATA SAVER RULE: Use mqdefault.jpg manually constructed
    return {
      title: data.title || "Unknown Title",
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to fetch video metadata");
  }
}
