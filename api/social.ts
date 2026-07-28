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
           where: { visibility: 'public', tags: { has: tag }, isHidden: false },
           include: { songs: true, user: { select: { name: true, username: true } } },
           orderBy: { likesCount: 'desc' }
         });
         return res.status(200).json({ playlists });
       }

       // Fetch Featured Curations (Quadrant 1)
       const featured = await prisma.playlist.findMany({
         where: { visibility: 'public', isFeatured: true, isHidden: false },
         orderBy: { featuredAt: 'desc' },
         take: 10,
         include: { songs: true, user: { select: { name: true, username: true } } }
       });

       const trending = await prisma.playlist.findMany({
         where: { visibility: 'public', isHidden: false },
         orderBy: { likesCount: 'desc' }, take: 10,
         include: { songs: true, user: { select: { name: true, username: true } } }
       });

       const fresh = await prisma.playlist.findMany({
         where: { visibility: 'public', isHidden: false },
         orderBy: { createdAt: 'desc' }, take: 10,
         include: { songs: true, user: { select: { name: true, username: true } } }
       });

       const allPublicPlaylists = await prisma.playlist.findMany({
         where: { visibility: 'public', isHidden: false }, select: { tags: true }
       });

       const tagCounts: Record<string, number> = {};
       for (const p of allPublicPlaylists) {
         for (const t of p.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
       }

       // Merge with official taxonomy tags (Quadrant 4)
       const systemTagsList = await prisma.systemTag.findMany({ select: { name: true } });
       const systemTagNames = systemTagsList.map(t => t.name);
       const combinedTags = [...new Set([...systemTagNames, ...Object.keys(tagCounts)])];
       const globalTags = combinedTags.sort((a, b) => {
         const countA = tagCounts[a] || 0;
         const countB = tagCounts[b] || 0;
         return countB - countA;
       });

       const popularSongs = await prisma.song.findMany({
         where: { playlist: { visibility: 'public', isHidden: false } },
         orderBy: { playCount: 'desc' },
         take: 9,
         include: {
           playlist: { select: { name: true, id: true, userId: true, visibility: true } }
         }
       });

       const popularUsers = await prisma.user.findMany({
         take: 8,
         select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
         }
       });

       const allSongsCount = await prisma.song.count({ where: { playlist: { visibility: 'public', isHidden: false } } });
       let quickPicks = [];
       if (allSongsCount > 0) {
           const skip = Math.max(0, Math.floor(Math.random() * allSongsCount) - 9);
           quickPicks = await prisma.song.findMany({
             where: { playlist: { visibility: 'public', isHidden: false } },
             skip: Math.max(0, skip),
             take: 9,
             include: { playlist: { select: { id: true } } }
           });
           quickPicks.sort(() => Math.random() - 0.5);
       }
       
       const user = getUser(req);
       let savedPlaylistIds = new Set();
       if (user) {
         const saved = await prisma.savedPlaylist.findMany({ where: { userId: user.id }, select: { playlistId: true } });
         saved.forEach(s => savedPlaylistIds.add(s.playlistId));
       }
       const mapSaved = (p) => ({ ...p, isSaved: savedPlaylistIds.has(p.id) });
       
       return res.status(200).json({ 
         featured: featured.map(mapSaved),
         trending: trending.map(mapSaved), 
         fresh: fresh.map(mapSaved), 
         globalTags, 
         popularSongs, 
         popularUsers, 
         quickPicks 
       });

     } catch (err) {
       return res.status(500).json({ error: 'Failed discovery' });
     }
  }

  if (type === 'trending') {
     try {
       const grouped = await prisma.song.groupBy({
         by: ['youtubeId', 'title', 'artist', 'thumbnailUrl', 'duration'],
         _sum: { playCount: true },
         where: { playCount: { gt: 0 } },
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

  
  if (type === 'recommended') {
     const user = getUser(req);
     if (!user) return res.status(401).json({ error: 'Unauthorized' });
     try {
       const topSongs = await prisma.song.findMany({
         where: { playlist: { userId: user.id } },
         orderBy: { playCount: 'desc' },
         take: 20
       });
       const artists = [...new Set(topSongs.filter(s => s.artist).map(s => s.artist))].slice(0, 5);
       
       if (artists.length === 0) {
           return res.status(200).json({ songs: [], basedOn: [] });
       }
       
       const recommended = await prisma.song.findMany({
         where: { 
           playlist: { visibility: 'public', isHidden: false },
           artist: { in: artists },
           NOT: { playlist: { userId: user.id } }
         },
         include: { playlist: { select: { id: true, name: true, userId: true } } },
         take: 20,
         orderBy: { playCount: 'desc' }
       });
       
       const uniqueRecs = [];
       const seen = new Set();
       for (const song of recommended) {
           if (!seen.has(song.youtubeId)) {
               seen.add(song.youtubeId);
               uniqueRecs.push(song);
           }
       }
       
       return res.status(200).json({ songs: uniqueRecs, basedOn: artists });
     } catch (err) {
       console.error(err);
       return res.status(500).json({ error: 'Failed recommended' });
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

        const totalLikedSongs = await prisma.song.count({
          where: { playlist: { userId: user.id }, isLiked: true }
        });

        const playedSongs = await prisma.song.findMany({
          where: { playlist: { userId: user.id }, playCount: { gt: 0 } },
          select: { duration: true, playCount: true }
        });

        let totalListeningTimeSeconds = 0;
        playedSongs.forEach(s => {
          if (!s.duration) return;
          const parts = s.duration.split(':').map(Number);
          let seconds = 0;
          if (parts.length === 1) seconds = parts[0] || 0;
          else if (parts.length === 2) seconds = (parts[0] || 0) * 60 + (parts[1] || 0);
          else if (parts.length === 3) seconds = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
          totalListeningTimeSeconds += seconds * s.playCount;
        });

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
        const publicPlaylistsCount = allPlaylists.filter(p => p.visibility === 'public').length;
        const totalPlaylists = allPlaylists.length;

        let totalSongsSaved = 0;
        const uniqueArtists = new Set<string>();
        
        allPlaylists.forEach(p => {
          totalSongsSaved += p.songs.length;
          p.songs.forEach(s => {
            if (s.artist) uniqueArtists.add(s.artist.toLowerCase());
          });
        });

        const library = {
          totalPlaylists,
          totalSongsSaved,
          uniqueArtistsSaved: uniqueArtists.size
        };

        const curatorScore = (totalLikes * 10) + (totalForks * 25) + (publicPlaylistsCount * 50);
        
        let curatorLevel = "Novice";
        if (curatorScore >= 1000) curatorLevel = "Icon";
        else if (curatorScore >= 500) curatorLevel = "Expert Curator";
        else if (curatorScore >= 200) curatorLevel = "Rising Curator";
        else if (curatorScore >= 50) curatorLevel = "Local Tastemaker";

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
          listener: { topArtists, topSong, totalPlays, totalLikedSongs, totalListeningTimeSeconds },
          curator: { totalLikes, totalForks, topPlaylist, hasPublicPlaylists, publicPlaylistsCount, curatorScore, curatorLevel },
          library
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

       
       const reqUser = getUser(req);
       let savedPlaylistIds = new Set();
       if (reqUser) {
         const saved = await prisma.savedPlaylist.findMany({ where: { userId: reqUser.id }, select: { playlistId: true } });
         saved.forEach(s => savedPlaylistIds.add(s.playlistId));
       }
       const mapSaved = (p) => ({ ...p, isSaved: savedPlaylistIds.has(p.id) });
       
       return res.status(200).json({ profile, playlists: playlists.map(mapSaved), totalLikes });

     } catch(err) {
       return res.status(500).json({ error: 'Failed profile '});
     }
  }

  return res.status(400).json({ error: 'Invalid type parameter' });
}
