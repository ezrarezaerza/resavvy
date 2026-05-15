import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function getLikedSongsHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const songs = await prisma.song.findMany({
      where: {
         playlist: {
           userId: req.user.id
         },
         isLiked: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(songs);
  } catch (error) {
    console.error('Get liked songs error:', error);
    return res.status(500).json({ error: 'Failed to fetch liked songs' });
  }
}
