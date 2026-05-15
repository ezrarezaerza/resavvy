import type { Request, Response } from 'express';
import ytSearch from 'yt-search';

export default async function handler(req: Request, res: Response) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Perform the search
    const r = await ytSearch(q);
    
    // Map and slice the top 5 results safely
    const results = r.videos.slice(0, 5).map((video: any) => ({
      id: video.videoId,
      title: video.title,
      artist: video.author?.name || 'Unknown Artist',
      thumbnail: video.thumbnail,
      duration: video.seconds || 0,
    }));

    return res.status(200).json(results);
  } catch (error: any) {
    console.error('Search API Error:', error);
    // Return a 500 status gracefully instead of crashing the Node process
    return res.status(500).json({ error: 'Failed to search YouTube', details: error.message });
  }
}
