import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function trendingHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const grouped = await prisma.song.groupBy({
      by: ['youtubeId', 'title', 'artist', 'thumbnailUrl', 'duration'],
      _sum: {
        playCount: true,
      },
      orderBy: {
        _sum: {
          playCount: 'desc'
        }
      },
      take: 10,
    });

    const formatted = grouped.map((g, index) => ({
      id: g.youtubeId,
      youtubeId: g.youtubeId,
      title: g.title,
      artist: g.artist,
      thumbnailUrl: g.thumbnailUrl,
      duration: g.duration,
      playCount: g._sum.playCount || 0,
      globalRank: index + 1
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Trending error:', error);
    return res.status(500).json({ error: 'Failed to fetch trending' });
  }
}
