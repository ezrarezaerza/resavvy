import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function createPlaylistHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, description, tags, visibility, coverType, customCoverUrl } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const playlist = await prisma.playlist.create({
      data: {
        userId: req.user.id,
        name,
        description,
        tags: tags || [],
        visibility: visibility || 'private',
        coverType: coverType || 'random',
        customCoverUrl
      },
      include: { songs: true }
    });

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
}
