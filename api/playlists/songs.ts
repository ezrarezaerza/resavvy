import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function addSongHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: playlistId } = req.params;
    const { youtubeId, title, artist, thumbnailUrl, duration } = req.body;

    if (!youtubeId || !title) {
       return res.status(400).json({ error: 'Missing required fields' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.user.id) {
       return res.status(403).json({ error: 'Forbidden' });
    }

    const song = await prisma.song.create({
      data: {
        youtubeId,
        title,
        artist,
        thumbnailUrl,
        duration,
        playlistId
      }
    });

    res.status(200).json(song);
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({ error: 'Failed to add song' });
  }
}
