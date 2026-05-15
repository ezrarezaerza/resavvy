import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function getLibrarySongsHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const songs = await prisma.song.findMany({
      where: {
        playlist: {
          userId: req.user.id
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    const uniqueSongsMap = new Map();
    for (const song of songs) {
      if (!uniqueSongsMap.has(song.youtubeId)) {
        uniqueSongsMap.set(song.youtubeId, song);
      }
    }
    const uniqueSongs = Array.from(uniqueSongsMap.values());

    res.status(200).json(uniqueSongs);
  } catch (error) {
    console.error('Get library songs error:', error);
    res.status(500).json({ error: 'Failed to fetch library songs' });
  }
}
