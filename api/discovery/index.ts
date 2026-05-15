import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function discoveryHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { tag } = req.query;

    if (tag && typeof tag === 'string') {
      const playlists = await prisma.playlist.findMany({
        where: {
          visibility: 'public',
          tags: {
            has: tag
          }
        },
        include: {
          songs: true,
          user: {
            select: { name: true, username: true }
          }
        },
        orderBy: {
          likesCount: 'desc'
        }
      });
      return res.status(200).json({ playlists });
    }

    const trending = await prisma.playlist.findMany({
      where: { visibility: 'public' },
      orderBy: { likesCount: 'desc' },
      take: 10,
      include: {
        songs: true,
        user: { select: { name: true, username: true } }
      }
    });

    const fresh = await prisma.playlist.findMany({
      where: { visibility: 'public' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        songs: true,
        user: { select: { name: true, username: true } }
      }
    });

    const allPublicPlaylists = await prisma.playlist.findMany({
      where: { visibility: 'public' },
      select: { tags: true }
    });

    const tagCounts: Record<string, number> = {};
    for (const p of allPublicPlaylists) {
      for (const t of p.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }

    const globalTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    return res.status(200).json({
      trending,
      fresh,
      globalTags
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return res.status(500).json({ error: 'Failed to fetch discovery data' });
  }
}
