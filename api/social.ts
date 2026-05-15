import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma.js';

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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { type, query, page = '1', limit = '50', username } = req.query;

  if (type === 'explore') {
    try {
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);
      const q = query as string;
      const whereClause = q ? {
         OR: [
           { title: { contains: q, mode: 'insensitive' as any } },
           { artist: { contains: q, mode: 'insensitive' as any } }
         ]
      } : {};

      const grouped = await prisma.song.groupBy({
        by: ['youtubeId', 'title', 'artist', 'thumbnailUrl', 'duration'],
        _sum: { playCount: true },
        _count: { id: true },
        where: whereClause,
        orderBy: { _sum: { playCount: 'desc' } },
        skip, take,
      });

      const formatted = grouped.map((g: any, index: number) => ({
        id: g.youtubeId,
        youtubeId: g.youtubeId,
        title: g.title,
        artist: g.artist,
        thumbnailUrl: g.thumbnailUrl,
        duration: g.duration,
        playCount: g._sum.playCount || 0,
        playlistCount: g._count.id,
        globalRank: skip + index + 1
      }));
      return res.status(200).json(formatted);
    } catch(err) {
      return res.status(500).json({ error: 'Failed explore' });
    }
  }

  if (type === 'discovery') {
     try {
       const { tag } = req.query;
       if (tag && typeof tag === 'string') {
         const playlists = await prisma.playlist.findMany({
           where: { visibility: 'public', tags: { has: tag } },
           include: { songs: true, user: { select: { name: true, username: true } } },
           orderBy: { likesCount: 'desc' }
         });
         return res.status(200).json({ playlists });
       }

       const trending = await prisma.playlist.findMany({
         where: { visibility: 'public' },
         orderBy: { likesCount: 'desc' }, take: 10,
         include: { songs: true, user: { select: { name: true, username: true } } }
       });

       const fresh = await prisma.playlist.findMany({
         where: { visibility: 'public' },
         orderBy: { createdAt: 'desc' }, take: 10,
         include: { songs: true, user: { select: { name: true, username: true } } }
       });

       const allPublicPlaylists = await prisma.playlist.findMany({
         where: { visibility: 'public' }, select: { tags: true }
       });

       const tagCounts: Record<string, number> = {};
       for (const p of allPublicPlaylists) {
         for (const t of p.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
       }
       const globalTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(e => e[0]);

       return res.status(200).json({ trending, fresh, globalTags });
     } catch (err) {
       return res.status(500).json({ error: 'Failed discovery' });
     }
  }

  if (type === 'trending') {
     try {
       const grouped = await prisma.song.groupBy({
         by: ['youtubeId', 'title', 'artist', 'thumbnailUrl', 'duration'],
         _sum: { playCount: true },
         orderBy: { _sum: { playCount: 'desc' } },
         take: 10,
       });

       const formatted = grouped.map((g: any, index: number) => ({
         id: g.youtubeId,
         youtubeId: g.youtubeId,
         title: g.title,
         artist: g.artist,
         thumbnailUrl: g.thumbnailUrl,
         duration: g.duration,
         playCount: g._sum.playCount || 0,
         globalRank: index + 1
       }));
       return res.status(200).json(formatted);
     } catch(err) {
       return res.status(500).json({ error: 'Failed trending' });
     }
  }

  if (type === 'rotation') {
     const user = getUser(req);
     if (!user) return res.status(401).json({ error: 'Unauthorized' });
     try {
       const songs = await prisma.song.findMany({
         where: { playlist: { userId: user.id }, playCount: { gt: 0 } },
         orderBy: { playCount: 'desc' },
         take: 25
       });

       const uniqueSongs = [];
       const seen = new Set();
       for (const song of songs) {
          if (!seen.has(song.youtubeId)) {
             seen.add(song.youtubeId);
             uniqueSongs.push(song);
          }
       }
       return res.status(200).json(uniqueSongs);
     } catch(err) {
       return res.status(500).json({ error: 'Failed rotation' });
     }
  }

  if (type === 'stats') {
     const user = getUser(req);
     if (!user) return res.status(401).json({ error: 'Unauthorized' });
     try {
        const topArtistsData = await prisma.song.groupBy({
          by: ['artist'],
          _sum: { playCount: true },
          where: { playlist: { userId: user.id }, artist: { not: '' } },
          orderBy: { _sum: { playCount: 'desc' } },
          take: 5
        });

        const topArtists = topArtistsData.map((d: any) => ({
          name: d.artist,
          playCount: d._sum.playCount || 0
        })).filter((a: any) => a.playCount > 0);

        const totalPlaysData = await prisma.song.aggregate({
          _sum: { playCount: true },
          where: { playlist: { userId: user.id } }
        });
        const totalPlays = totalPlaysData._sum.playCount || 0;

        const topSong = await prisma.song.findFirst({
          where: { playlist: { userId: user.id }, playCount: { gt: 0 } },
          orderBy: { playCount: 'desc' }
        });

        const playlistsAgg = await prisma.playlist.aggregate({
          _sum: { likesCount: true, forksCount: true },
          where: { userId: user.id }
        });

        const totalLikes = playlistsAgg._sum.likesCount || 0;
        const totalForks = playlistsAgg._sum.forksCount || 0;

        const allPlaylists = await prisma.playlist.findMany({
          where: { userId: user.id },
          include: { songs: true, user: { select: { name: true, username: true } } }
        });

        const hasPublicPlaylists = allPlaylists.some(p => p.visibility === 'public');

        let topPlaylist = null;
        if (allPlaylists.length > 0) {
          topPlaylist = allPlaylists.reduce((prev, current) => {
            const prevScore = (prev.likesCount || 0) + (prev.forksCount || 0);
            const currScore = (current.likesCount || 0) + (current.forksCount || 0);
            return (currScore > prevScore) ? current : prev;
          });
          if ((topPlaylist.likesCount || 0) + (topPlaylist.forksCount || 0) === 0) {
            topPlaylist = null;
          }
        }

        return res.status(200).json({
          listener: { topArtists, topSong, totalPlays },
          curator: { totalLikes, totalForks, topPlaylist, hasPublicPlaylists }
        });
     } catch(err) {
        return res.status(500).json({ error: 'Failed stats' });
     }
  }

  if (type === 'profile' && username) {
     try {
       const profile = await prisma.user.findUnique({
         where: { username: username as string },
         select: { id: true, name: true, username: true, bio: true, avatarUrl: true }
       });
       if (!profile) return res.status(404).json({ error: 'User not found' });

       const playlists = await prisma.playlist.findMany({
         where: { userId: profile.id, visibility: 'public' },
         include: { songs: true, user: { select: { name: true, username: true } } },
         orderBy: { createdAt: 'desc' }
       });
       const totalLikes = playlists.reduce((acc, p) => acc + (p.likesCount || 0), 0);

       return res.status(200).json({ profile, playlists, totalLikes });
     } catch(err) {
       return res.status(500).json({ error: 'Failed profile '});
     }
  }

  return res.status(400).json({ error: 'Invalid type parameter' });
}
