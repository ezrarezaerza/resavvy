import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function heavyRotationHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const songs = await prisma.song.findMany({
      where: {
        playlist: {
          userId: req.user.id
        },
        playCount: {
          gt: 0
        }
      },
      orderBy: {
        playCount: 'desc'
      },
      take: 25
    });

    // Deduplicate in memory just in case user has same song
    const uniqueSongs = [];
    const seen = new Set();
    for (const song of songs) {
       if (!seen.has(song.youtubeId)) {
          seen.add(song.youtubeId);
          uniqueSongs.push(song);
       }
    }

    return res.status(200).json(uniqueSongs);
  } catch (error) {
    console.error('Heavy rotation error:', error);
    return res.status(500).json({ error: 'Failed to fetch heavy rotation' });
  }
}
