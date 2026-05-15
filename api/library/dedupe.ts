import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function dedupeHandler(req: AuthRequest, res: Response) {
  if (req.method === 'GET') {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      // Fetch all songs for the user
      const songs = await prisma.song.findMany({
        where: {
          playlist: {
            userId: req.user.id
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const youtubeIdMap = new Map();
      for (const song of songs) {
        if (!youtubeIdMap.has(song.youtubeId)) {
          youtubeIdMap.set(song.youtubeId, []);
        }
        youtubeIdMap.get(song.youtubeId).push(song);
      }

      const duplicates = [];
      for (const [youtubeId, groupedSongs] of youtubeIdMap.entries()) {
        if (groupedSongs.length > 1) {
          duplicates.push({
            youtubeId,
            title: groupedSongs[0].title,
            thumbnailUrl: groupedSongs[0].thumbnailUrl,
            artist: groupedSongs[0].artist,
            count: groupedSongs.length,
            songs: groupedSongs
          });
        }
      }

      return res.status(200).json(duplicates);
    } catch (error) {
      console.error('Get duplicates error:', error);
      return res.status(500).json({ error: 'Failed to fetch duplicates' });
    }
  } else if (req.method === 'POST') {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { groupingList } = req.body; // array of youtubeIds to dedupe
      if (!groupingList || !Array.isArray(groupingList)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      let masterUpdated = 0;
      let duplicatesDeleted = 0;

      for (const group of groupingList) {
        const youtubeId = group.youtubeId;
        if (!youtubeId) continue;

        const songs = await prisma.song.findMany({
          where: {
            youtubeId: youtubeId,
            playlist: {
              userId: req.user.id
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        if (songs.length > 1) {
          const master = songs[0];
          const duplicates = songs.slice(1);
          
          const totalDuplicatePlayCount = duplicates.reduce((acc, s) => acc + (s.playCount || 0), 0);

          await prisma.song.update({
            where: { id: master.id },
            data: {
              playCount: master.playCount + totalDuplicatePlayCount
            }
          });

          await prisma.song.deleteMany({
            where: {
              id: {
                in: duplicates.map(s => s.id)
              }
            }
          });

          masterUpdated++;
          duplicatesDeleted += duplicates.length;
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: `Merged ${masterUpdated} songs, deleted ${duplicatesDeleted} duplicates.` 
      });
    } catch (error) {
      console.error('Merge duplicates error:', error);
      return res.status(500).json({ error: 'Failed to merge duplicates' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
