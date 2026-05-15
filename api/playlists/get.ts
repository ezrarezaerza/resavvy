import type { Request, Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function publicFetchHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.params;

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: true,
        user: {
          select: { name: true, username: true }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.visibility === 'private') {
      if (!req.user || req.user.id !== playlist.userId) {
        return res.status(403).json({ error: 'Forbidden. This playlist is private.' });
      }
    }

    res.status(200).json(playlist);
  } catch (error) {
    console.error('Fetch public playlist error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
}
