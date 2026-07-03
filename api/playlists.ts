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
  const { id, action } = req.query;
  const playlistId = typeof id === 'string' ? id : undefined;

  // GET
  if (req.method === 'GET') {
    if (playlistId) {
       try {
         const playlist = await prisma.playlist.findUnique({
           where: { id: playlistId },
           include: { songs: { orderBy: { order: 'asc' } }, user: { select: { name: true, username: true } } }
         });
         if (!playlist) return res.status(404).json({ error: 'Not found' });
         if (playlist.visibility === 'private' && (!user || user.id !== playlist.userId)) {
           return res.status(403).json({ error: 'Forbidden' });
         }
         let isSaved = false;
         if (user) {
           const savedRecord = await prisma.savedPlaylist.findUnique({
             where: { userId_playlistId: { userId: user.id, playlistId } }
           });
           isSaved = !!savedRecord;
         }
         return res.status(200).json({ ...playlist, isSaved });
       } catch (error) {
         return res.status(500).json({ error: 'Failed to fetch playlist' });
       }
    } else {
       if (!user) return res.status(401).json({ error: 'Unauthorized' });
       try {
         const ownedPlaylists = await prisma.playlist.findMany({
           where: { userId: user.id },
           include: { songs: { orderBy: { order: 'asc' } }, user: { select: { name: true, username: true } } }
         });

         const savedRecords = await prisma.savedPlaylist.findMany({
           where: { userId: user.id },
           include: {
             playlist: {
               include: { songs: { orderBy: { order: 'asc' } }, user: { select: { name: true, username: true } } }
             }
           }
         });

         const savedPlaylists = savedRecords.map(record => ({
           ...record.playlist,
           isSaved: true
         }));
         const savedIds = new Set(savedPlaylists.map(p => p.id));
         const ownedPlaylistsMapped = ownedPlaylists.map(p => ({
           ...p,
           isSaved: savedIds.has(p.id)
         })).filter(p => !savedIds.has(p.id));
         
         return res.status(200).json([...ownedPlaylistsMapped, ...savedPlaylists]);
       } catch (error) {
         return res.status(500).json({ error: 'Failed to fetch playlists' });
       }
    }
  }

  // Auth required for mutating
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // POST
  if (req.method === 'POST') {
    if (action === 'save' && playlistId) {
      try {
        const original = await prisma.playlist.findUnique({ where: { id: playlistId } });
        if (!original) return res.status(404).json({ error: 'Not found' });
        if (original.visibility === 'private' && original.userId !== user.id) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        await prisma.savedPlaylist.create({
          data: {
            userId: user.id,
            playlistId
          }
        });
        await prisma.playlist.update({ where: { id: playlistId }, data: { likesCount: { increment: 1 } } });
        return res.status(200).json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to save playlist' });
      }
    } else if (action === 'unsave' && playlistId) {
      try {
        await prisma.savedPlaylist.delete({
          where: {
            userId_playlistId: {
              userId: user.id,
              playlistId
            }
          }
        });
        // We do not decrement likesCount on unsave
        return res.status(200).json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to unsave playlist' });
      }
    } else if (action === 'import' && playlistId) {
      try {
        const original = await prisma.playlist.findUnique({ where: { id: playlistId }, include: { songs: { orderBy: { order: 'asc' } } } });
        if (!original) return res.status(404).json({ error: 'Not found' });
        if (original.visibility === 'private' && original.userId !== user.id) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        
        const newPlaylist = await prisma.playlist.create({
          data: {
            userId: user.id,
            name: `${original.name} (Copy)`,
            description: original.description,
            tags: original.tags,
            visibility: 'private',
            coverType: original.coverType,
            customCoverUrl: original.customCoverUrl,
            songs: {
               create: original.songs.map(song => ({
                   youtubeId: song.youtubeId,
                   title: song.title,
                   artist: song.artist,
                   thumbnailUrl: song.thumbnailUrl,
                   duration: song.duration
               }))
            }
          },
          include: { songs: { orderBy: { order: 'asc' } } }
        });

        if (original.userId !== user.id) {
            await prisma.playlist.update({ where: { id: playlistId }, data: { forksCount: { increment: 1 } }});
        }
        return res.status(201).json(newPlaylist);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to import playlist' });
      }
    } else {
      // Create new playlist
      try {
        const { name, description, tags, visibility, coverType, customCoverUrl } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });
        const newPlaylist = await prisma.playlist.create({
          data: { 
            userId: user.id, 
            name, description, tags, visibility, 
            coverType: coverType || 'random', 
            customCoverUrl 
          },
          include: { songs: { orderBy: { order: 'asc' } } }
        });
        return res.status(201).json(newPlaylist);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to create playlist' });
      }
    }
  }

  // PUT
  if (req.method === 'PUT' && playlistId) {
     try {
        const existing = await prisma.playlist.findUnique({ where: { id: playlistId } });
        if (!existing || existing.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

        const { name, description, tags, visibility, coverType, customCoverUrl } = req.body;
        const updated = await prisma.playlist.update({
          where: { id: playlistId },
          data: { 
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(tags !== undefined && { tags }),
            ...(visibility !== undefined && { visibility }),
            ...(coverType !== undefined && { coverType }),
            ...(customCoverUrl !== undefined && { customCoverUrl }),
          },
          include: { songs: { orderBy: { order: 'asc' } } }
        });
        return res.status(200).json(updated);
     } catch (error) {
        return res.status(500).json({ error: 'Failed to update playlist' });
     }
  }

  // DELETE
  if (req.method === 'DELETE' && playlistId) {
     try {
       const existing = await prisma.playlist.findUnique({ where: { id: playlistId } });
       if (!existing || existing.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

       await prisma.playlist.delete({ where: { id: playlistId } });
       return res.status(204).end();
     } catch (error) {
       return res.status(500).json({ error: 'Failed to delete playlist' });
     }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
