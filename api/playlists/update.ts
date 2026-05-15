import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function updatePlaylistHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { name, description, tags, visibility, coverType, customCoverUrl } = req.body;
    
    // Check ownership
    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Playlist not found' });
    if (existing.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.playlist.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        tags: tags !== undefined ? tags : existing.tags,
        visibility: visibility !== undefined ? visibility : existing.visibility,
        coverType: coverType !== undefined ? coverType : existing.coverType,
        customCoverUrl: customCoverUrl !== undefined ? customCoverUrl : existing.customCoverUrl,
      },
      include: { songs: true }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
}
