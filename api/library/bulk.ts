import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function bulkAddSongsHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { targetPlaylistId, songs } = req.body;
    
    if (!targetPlaylistId || !songs || !Array.isArray(songs)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: targetPlaylistId }
    });

    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const songsToInsert = songs.map((song: any) => ({
      playlistId: targetPlaylistId,
      youtubeId: song.youtubeId || song.id, // Fallback to id if youtubeId is not present
      title: song.title,
      artist: song.artist,
      thumbnailUrl: song.thumbnailUrl,
      duration: song.duration,
      playCount: 0
    }));

    await prisma.song.createMany({
      data: songsToInsert
    });

    res.status(201).json({ success: true, insertedCount: songsToInsert.length });
  } catch (error) {
    console.error('Bulk add error:', error);
    res.status(500).json({ error: 'Failed to bulk add songs' });
  }
}
