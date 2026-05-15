import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function statsHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Listener Stats
    const topArtistsData = await prisma.song.groupBy({
      by: ['artist'],
      _sum: {
        playCount: true,
      },
      where: {
        playlist: {
          userId: req.user.id
        },
        artist: {
          not: '' // Try to avoid empty string artists
        }
      },
      orderBy: {
        _sum: {
          playCount: 'desc'
        }
      },
      take: 5
    });

    const topArtists = topArtistsData.map(d => ({
      name: d.artist,
      playCount: d._sum.playCount || 0
    })).filter(a => a.playCount > 0);

    const totalPlaysData = await prisma.song.aggregate({
      _sum: {
        playCount: true
      },
      where: {
        playlist: {
          userId: req.user.id
        }
      }
    });
    
    const totalPlays = totalPlaysData._sum.playCount || 0;

    const topSong = await prisma.song.findFirst({
      where: {
        playlist: {
          userId: req.user.id
        },
        playCount: { gt: 0 }
      },
      orderBy: {
        playCount: 'desc'
      }
    });

    // Curator Stats
    const playlistsAgg = await prisma.playlist.aggregate({
      _sum: {
        likesCount: true,
        forksCount: true
      },
      where: {
        userId: req.user.id
      }
    });

    const totalLikes = playlistsAgg._sum.likesCount || 0;
    const totalForks = playlistsAgg._sum.forksCount || 0;

    // Use raw query or multiple queries for top playlist by sum of likes + forks
    const allPlaylists = await prisma.playlist.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        songs: true,
        user: { select: { name: true, username: true } }
      }
    });

    const hasPublicPlaylists = allPlaylists.some(p => p.visibility === 'public');

    let topPlaylist = null;
    if (allPlaylists.length > 0) {
      topPlaylist = allPlaylists.reduce((prev, current) => {
        const prevScore = (prev.likesCount || 0) + (prev.forksCount || 0);
        const currScore = (current.likesCount || 0) + (current.forksCount || 0);
        return (currScore > prevScore) ? current : prev;
      });
      // ONLY return if it actually has engagement, otherwise it's just arbitrary based on order
      if ((topPlaylist.likesCount || 0) + (topPlaylist.forksCount || 0) === 0) {
        topPlaylist = null;
      }
    }

    return res.status(200).json({
      listener: {
        topArtists,
        topSong,
        totalPlays
      },
      curator: {
        totalLikes,
        totalForks,
        topPlaylist,
        hasPublicPlaylists
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
}
