import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function toggleLikeHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params; // this might be tricky, it's defined as api/songs/like.ts, probably expects id in body
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ error: 'Missing songId' });
    }

    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: { playlist: true }
    });

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (song.playlist.userId !== req.user.id) {
       return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.song.update({
      where: { id: songId },
      data: { isLiked: !song.isLiked }
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Toggle like error:', error);
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
}
