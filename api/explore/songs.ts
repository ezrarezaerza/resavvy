import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function exploreSongsHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { query, page = '1', limit = '50' } = req.query as { query?: string, page?: string, limit?: string };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const whereClause = query ? {
      OR: [
        { title: { contains: query, mode: 'insensitive' as any } },
        { artist: { contains: query, mode: 'insensitive' as any } }
      ]
    } : {};

    const grouped = await prisma.song.groupBy({
      by: ['youtubeId', 'title', 'artist', 'thumbnailUrl', 'duration'],
      _sum: {
        playCount: true,
      },
      _count: {
        id: true,
      },
      where: whereClause,
      orderBy: {
        _sum: {
          playCount: 'desc'
        }
      },
      skip,
      take,
    });

    const formatted = grouped.map((g, index) => ({
      id: g.youtubeId,
      youtubeId: g.youtubeId,
      title: g.title,
      artist: g.artist,
      thumbnailUrl: g.thumbnailUrl,
      duration: g.duration,
      playCount: g._sum.playCount || 0,
      playlistCount: g._count.id,
      globalRank: skip + index + 1
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Explore songs error:', error);
    return res.status(500).json({ error: 'Failed to fetch explore songs' });
  }
}
