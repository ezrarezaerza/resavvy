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
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { action, songId } = req.query;

  // GET
  if (req.method === 'GET') {
    if (action === 'dedupe') {
       try {
         const songs = await prisma.song.findMany({
           where: { playlist: { userId: user.id } },
           include: { playlist: { select: { name: true } } }
         });

         const grouped = songs.reduce((acc: any, song) => {
           if (!acc[song.youtubeId]) acc[song.youtubeId] = [];
           acc[song.youtubeId].push(song);
           return acc;
         }, {});

         const duplicates = Object.entries(grouped)
           .filter(([_, group]: any) => group.length > 1)
           .map(([youtubeId, group]: any) => ({
             youtubeId,
             title: group[0].title,
             artist: group[0].artist,
             thumbnailUrl: group[0].thumbnailUrl,
             count: group.length,
             occurrences: group.map((g: any) => ({
               songId: g.id,
               playlistName: g.playlist.name,
               addedAt: g.addedAt
             }))
           }));
         return res.status(200).json(duplicates);
       } catch (error) {
         return res.status(500).json({ error: 'Failed' });
       }
    } else if (action === 'liked') {
       try {
         const songs = await prisma.song.findMany({
           where: { playlist: { userId: user.id }, isLiked: true },
           orderBy: { createdAt: 'desc' }
         });
         return res.status(200).json(songs);
       } catch (error) {
         return res.status(500).json({ error: 'Failed to fetch liked songs' });
       }
    } else {
       // Library
       try {
         const songs = await prisma.song.findMany({
           where: { playlist: { userId: user.id } },
           orderBy: { createdAt: 'desc' }
         });
         return res.status(200).json(songs);
       } catch(error) {
         return res.status(500).json({ error: 'Failed' });
       }
    }
  }

  // POST
  if (req.method === 'POST') {
     if (action === 'dedupe-merge') {
         // Handle dedupe merge
         try {
           const { youtubeId, keepSongId } = req.body;
           const songs = await prisma.song.findMany({
             where: { youtubeId: youtubeId as string, playlist: { userId: user.id } }
           });
           const toDelete = songs.filter(s => s.id !== keepSongId).map(s => s.id);
           await prisma.song.deleteMany({ where: { id: { in: toDelete } } });
           return res.status(200).json({ message: 'Merged', deletedCount: toDelete.length });
         } catch(error) {
           return res.status(500).json({ error: 'Failed merge' });
         }
     }
     
     if (action === 'bulk') {
         try {
           const { playlistId, items } = req.body;
           const playlist = await prisma.playlist.findUnique({ where: { id: playlistId }});
           if (!playlist || playlist.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });
           
           const dataToInsert = items.map((item: any) => ({
             playlistId,
             youtubeId: item.youtubeId,
             title: item.title,
             artist: item.artist,
             thumbnailUrl: item.thumbnailUrl,
             duration: item.duration !== undefined ? String(item.duration) : '0:00'
           }));

           await prisma.song.createMany({ data: dataToInsert });
           return res.status(201).json({ added: dataToInsert.length });
         } catch(error) {
           return res.status(500).json({ error: 'Failed' });
         }
     }

     if (action === 'like') {
         try {
           const { songId } = req.body;
           if (!songId) return res.status(400).json({ error: 'Missing songId' });

           const song = await prisma.song.findUnique({
             where: { id: songId },
             include: { playlist: true }
           });

           if (!song || song.playlist.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

           const updated = await prisma.song.update({
             where: { id: songId },
             data: { isLiked: !song.isLiked }
           });
           return res.status(200).json(updated);
         } catch(error) {
           return res.status(500).json({ error: 'Failed' });
         }
     }

     // add single song
     try {
       const { playlistId, youtubeId, title, artist, thumbnailUrl, duration } = req.body;
       const playlist = await prisma.playlist.findUnique({ where: { id: playlistId }});
       if (!playlist || playlist.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });
       
       const song = await prisma.song.create({
         data: { playlistId, youtubeId, title, artist, thumbnailUrl, duration: duration !== undefined ? String(duration) : '0:00' }
       });
       return res.status(201).json(song);
     } catch(error) {
       return res.status(500).json({ error: 'Failed' });
     }
  }

  // DELETE
  if (req.method === 'DELETE' && songId) {
     try {
       const song = await prisma.song.findUnique({ where: { id: songId as string }, include: { playlist: true } });
       if (!song || song.playlist.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });
       
       await prisma.song.delete({ where: { id: song.id } });
       return res.status(204).end();
     } catch(error) {
       return res.status(500).json({ error: 'Failed' });
     }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
