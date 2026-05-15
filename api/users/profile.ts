import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function publicProfileHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Missing username' });
    }

    const profile = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const playlists = await prisma.playlist.findMany({
      where: {
        userId: profile.id,
        visibility: 'public'
      },
      include: {
        songs: true,
        user: { select: { name: true, username: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalLikes = playlists.reduce((acc, p) => acc + (p.likesCount || 0), 0);

    return res.status(200).json({
      profile,
      playlists,
      totalLikes
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch public profile' });
  }
}
