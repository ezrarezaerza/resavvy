import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { prisma } from '../../src/lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

function getUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const user = getUser(req);
  const userId = user?.id;
  const searchQuery = q.toLowerCase();

  try {
    // 1. Search Playlists
    // We want to find playlists that are matching the name or description or tags
    // and are either owned by the user, OR are public.
    const playlists = await prisma.playlist.findMany({
      where: {
        AND: [
          userId ? {
            OR: [
              { visibility: 'public' },
              { userId: userId }
            ]
          } : { visibility: 'public' },
          {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
              { tags: { has: searchQuery } } // Wait, has is case sensitive. We might just search name and description for now.
            ]
          }
        ]
      },
      include: {
        user: { select: { name: true, username: true } },
        songs: { select: { id: true, thumbnailUrl: true }, take: 1 } // just to know if it has songs or to get song count optionally
      },
      take: 10
    });

    // 2. Search Songs
    // We want to find songs matching title or artist
    // where the playlist is either owned by the user or is public.
    const songs = await prisma.song.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { artist: { contains: searchQuery, mode: 'insensitive' } }
            ]
          },
          userId ? {
            playlist: {
              OR: [
                { visibility: 'public' },
                { userId: userId }
              ]
            }
          } : {
            playlist: { visibility: 'public' }
          }
        ]
      },
      include: {
        playlist: { select: { name: true, id: true, userId: true, visibility: true } }
      },
      take: 10
    });

    // 3. Search Users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { username: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true
      },
      take: 10
    });

    return res.status(200).json({
      playlists,
      songs,
      users
    });
  } catch (error: any) {
    console.error('Global Search API Error:', error);
    return res.status(500).json({ error: 'Failed to perform global search', details: error.message });
  }
}
