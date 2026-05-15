import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function importPlaylistHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: currentUserId } = req.user;

    // Fetch original
    const originalPlaylist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: true
      }
    });

    if (!originalPlaylist) {
      return res.status(404).json({ error: 'Original playlist not found' });
    }

    if (originalPlaylist.visibility === 'private' && originalPlaylist.userId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden. This playlist is private.' });
    }

    // Create cloned playlist
    const newPlaylist = await prisma.playlist.create({
      data: {
        userId: currentUserId,
        name: `${originalPlaylist.name} (Copy)`,
        description: originalPlaylist.description,
        tags: originalPlaylist.tags,
        visibility: 'private', // make the clone private initially
        coverType: originalPlaylist.coverType,
        customCoverUrl: originalPlaylist.customCoverUrl,
        songs: {
          create: originalPlaylist.songs.map(song => ({
            youtubeId: song.youtubeId,
            title: song.title,
            artist: song.artist,
            thumbnailUrl: song.thumbnailUrl,
            duration: song.duration
          }))
        }
      },
      include: {
        songs: true
      }
    });

    res.status(201).json(newPlaylist);
  } catch (error) {
    console.error('Import playlist error:', error);
    res.status(500).json({ error: 'Failed to import playlist' });
  }
}
