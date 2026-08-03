import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/lib/prisma.js';
import { checkAdmin, logSystemEvent } from './admin/helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  // 1. SETUP / SEEDING ROUTE (Public/Semi-public for first time setup)
  if (action === 'setup') {
    try {
      // Check if any admin exists in the database
      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      const { username } = req.body || {};

      if (existingAdmin) {
        // If an admin already exists, only an existing admin can promote other users
        const adminUser = await checkAdmin(req, res);
        if (!adminUser) return; // checkAdmin handles error response

        if (!username) return res.status(400).json({ error: 'Missing username to promote' });
        const userToPromote = await prisma.user.update({
          where: { username },
          data: { role: 'ADMIN' }
        });
        await logSystemEvent('AUDIT', `Admin ${adminUser.username} promoted ${username} to ADMIN`);
        return res.status(200).json({ message: `Successfully promoted ${username} to ADMIN`, user: userToPromote });
      } else {
        // No admin exists yet (Bootstrap phase)
        // If username is provided, promote that user. Otherwise, make the first registered user an Admin.
        let user;
        if (username) {
          user = await prisma.user.findUnique({ where: { username } });
        } else {
          user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
        }

        if (!user) {
          return res.status(404).json({ error: 'No users found to promote to ADMIN. Please register first.' });
        }

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        });

        await logSystemEvent('AUDIT', `System auto-promoted first user ${updatedUser.username} to ADMIN`);
        return res.status(200).json({
          message: `System successfully bootstrapped. ${updatedUser.username} is now ADMIN.`,
          user: { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role }
        });
      }
    } catch (err: any) {
      await logSystemEvent('ERROR', 'System administration bootstrap failed', err.message);
      return res.status(500).json({ error: 'Bootstrap failed', details: err.message });
    }
  }

  // --- Authenticated Admin Zone ---
  const adminUser = await checkAdmin(req, res);
  if (!adminUser) return; // Handled by checkAdmin

  // --- Quadrant 2: User Profile & Access Administration ---
  if (action === 'get-users') {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { playlists: true, savedPlaylists: true }
          }
        }
      });

      return res.status(200).json(
        users.map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt,
          role: u.role,
          status: u.status,
          suspensionExpiresAt: u.suspensionExpiresAt,
          moderationWarning: u.moderationWarning,
          totalPlaylists: u._count.playlists,
          totalSaved: u._count.savedPlaylists
        }))
      );
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch users list', details: err.message });
    }
  }

  if (action === 'update-user-role') {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) return res.status(400).json({ error: 'userId and role are required' });

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} updated role of ${updated.username} to ${role}`);
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update user role', details: err.message });
    }
  }

  if (action === 'update-user-status') {
    try {
      const { userId, status, durationDays, warningMessage } = req.body;
      if (!userId || !status) return res.status(400).json({ error: 'userId and status are required' });

      let suspensionExpiresAt = null;
      if (status === 'SUSPENDED' && durationDays) {
        const expires = new Date();
        expires.setDate(expires.getDate() + parseInt(durationDays));
        suspensionExpiresAt = expires;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          status,
          suspensionExpiresAt,
          moderationWarning: warningMessage || null
        }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} set status of ${updated.username} to ${status}`, `Warning: ${warningMessage || 'None'}, Expires: ${suspensionExpiresAt || 'Never'}`);
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update user status', details: err.message });
    }
  }

  // --- Quadrant 1: Content & Playlist Moderation ---
  if (action === 'get-playlists') {
    try {
      const playlists = await prisma.playlist.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, username: true }
          },
          _count: {
            select: { songs: true }
          }
        }
      });

      return res.status(200).json(playlists);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch playlists', details: err.message });
    }
  }

  if (action === 'moderate-playlist') {
    try {
      const { playlistId, isFlagged, flagReason, isHidden, isFeatured } = req.body;
      if (!playlistId) return res.status(400).json({ error: 'playlistId is required' });

      const updateData: any = {};
      if (isFlagged !== undefined) updateData.isFlagged = isFlagged;
      if (flagReason !== undefined) updateData.flagReason = flagReason;
      if (isHidden !== undefined) updateData.isHidden = isHidden;
      if (isFeatured !== undefined) {
        updateData.isFeatured = isFeatured;
        updateData.featuredAt = isFeatured ? new Date() : null;
      }

      const updated = await prisma.playlist.update({
        where: { id: playlistId },
        data: updateData
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} moderated playlist ${updated.name}`, JSON.stringify(updateData));
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to moderate playlist', details: err.message });
    }
  }

  if (action === 'get-dead-songs') {
    try {
      const songs = await prisma.song.findMany({
        where: {
          isDeadLink: true
        },
        orderBy: { playCount: 'desc' },
        include: {
          playlist: {
            select: { id: true, name: true, user: { select: { username: true } } }
          }
        }
      });
      return res.status(200).json(songs);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch dead songs', details: err.message });
    }
  }

  if (action === 'clear-dead-song') {
    try {
      const { songId } = req.body;
      if (!songId) return res.status(400).json({ error: 'songId is required' });

      const updated = await prisma.song.update({
        where: { id: songId },
        data: { isDeadLink: false }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} marked song ${updated.title} as active and cleared dead status`);
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to clear dead song status', details: err.message });
    }
  }

  // --- Quadrant 3: Platform Health & API Quota Tracking ---
  if (action === 'get-logs') {
    try {
      const logs = await prisma.systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return res.status(200).json(logs.map(log => ({
        id: log.id,
        createdAt: log.createdAt,
        type: log.level,
        description: log.message,
        details: log.details
      })));
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch system logs', details: err.message });
    }
  }

  if (action === 'get-quota') {
    try {
      const quotaRecords = await prisma.apiQuotaUsage.findMany({
        orderBy: { date: 'desc' },
        take: 30
      });
      return res.status(200).json(quotaRecords.map(q => ({
        id: q.id,
        date: q.date,
        youtubeQuotaUsed: q.quotaUsed,
        totalRequests: q.requests
      })));
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch quota records', details: err.message });
    }
  }

  // --- Quadrant 4: Global Curation & Tag Control ---
  if (action === 'get-tags') {
    try {
      const tags = await prisma.systemTag.findMany({
        orderBy: { name: 'asc' }
      });
      return res.status(200).json(tags);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch tags', details: err.message });
    }
  }

  if (action === 'add-tag') {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Tag name is required' });

      const formattedName = name.trim();
      const tag = await prisma.systemTag.upsert({
        where: { name: formattedName },
        update: {},
        create: { name: formattedName }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} added system tag: ${formattedName}`);
      return res.status(201).json(tag);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to add tag', details: err.message });
    }
  }

  if (action === 'delete-tag') {
    try {
      const { id, name } = req.body;
      if (!id && !name) return res.status(400).json({ error: 'Tag ID or name is required' });

      if (id) {
        const deleted = await prisma.systemTag.delete({ where: { id } });
        await logSystemEvent('AUDIT', `Admin ${adminUser.username} deleted system tag: ${deleted.name}`);
        return res.status(200).json(deleted);
      } else {
        const deleted = await prisma.systemTag.delete({ where: { name } });
        await logSystemEvent('AUDIT', `Admin ${adminUser.username} deleted system tag: ${deleted.name}`);
        return res.status(200).json(deleted);
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete tag', details: err.message });
    }
  }

  if (action === 'get-config') {
    try {
      const configs = await prisma.systemConfig.findMany();
      return res.status(200).json(configs);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch configs', details: err.message });
    }
  }

  if (action === 'update-config') {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) return res.status(400).json({ error: 'key and value are required' });

      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} updated config toggle ${key} to ${value}`);
      return res.status(200).json(config);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update config', details: err.message });
    }
  }

  if (action === 'bulk-moderate-playlists') {
    try {
      const { playlistIds, updates } = req.body;
      if (!playlistIds || !Array.isArray(playlistIds)) {
        return res.status(400).json({ error: 'playlistIds array is required' });
      }
      const updateData: any = {};
      if (updates.isFlagged !== undefined) updateData.isFlagged = updates.isFlagged;
      if (updates.flagReason !== undefined) updateData.flagReason = updates.flagReason;
      if (updates.isHidden !== undefined) updateData.isHidden = updates.isHidden;
      if (updates.isFeatured !== undefined) {
        updateData.isFeatured = updates.isFeatured;
        updateData.featuredAt = updates.isFeatured ? new Date() : null;
      }

      const updated = await prisma.playlist.updateMany({
        where: { id: { in: playlistIds } },
        data: updateData
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} bulk moderated ${playlistIds.length} playlists`, JSON.stringify(updates));
      return res.status(200).json({ count: updated.count });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to bulk moderate playlists', details: err.message });
    }
  }

  if (action === 'bulk-clear-dead-songs') {
    try {
      const { songIds } = req.body;
      if (!songIds || !Array.isArray(songIds)) {
        return res.status(400).json({ error: 'songIds array is required' });
      }

      const updated = await prisma.song.updateMany({
        where: { id: { in: songIds } },
        data: { isDeadLink: false }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} bulk cleared dead link status for ${songIds.length} songs`);
      return res.status(200).json({ count: updated.count });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to bulk clear dead songs', details: err.message });
    }
  }

  if (action === 'get-playlist-details') {
    try {
      const { playlistId } = req.query;
      if (!playlistId || typeof playlistId !== 'string') {
        return res.status(400).json({ error: 'playlistId is required' });
      }

      const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        include: {
          songs: { orderBy: { order: 'asc' } },
          user: { select: { id: true, name: true, username: true } }
        }
      });

      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
      return res.status(200).json(playlist);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch playlist details', details: err.message });
    }
  }

  if (action === 'delete-song') {
    try {
      const { songId } = req.body;
      if (!songId) return res.status(400).json({ error: 'songId is required' });

      const song = await prisma.song.findUnique({
        where: { id: songId },
        include: { playlist: true }
      });
      if (!song) return res.status(404).json({ error: 'Song not found' });

      await prisma.song.delete({
        where: { id: songId }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} deleted song "${song.title}" from playlist "${song.playlist.name}"`);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete song', details: err.message });
    }
  }

  if (action === 'update-song') {
    try {
      const { songId, title, artist, isDeadLink } = req.body;
      if (!songId) return res.status(400).json({ error: 'songId is required' });

      const updated = await prisma.song.update({
        where: { id: songId },
        data: {
          ...(title !== undefined && { title }),
          ...(artist !== undefined && { artist }),
          ...(isDeadLink !== undefined && { isDeadLink })
        },
        include: { playlist: true }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} updated song "${updated.title}" in playlist "${updated.playlist.name}"`);
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update song metadata', details: err.message });
    }
  }

  if (action === 'update-playlist') {
    try {
      const { playlistId, name, description, visibility } = req.body;
      if (!playlistId) return res.status(400).json({ error: 'playlistId is required' });

      const updated = await prisma.playlist.update({
        where: { id: playlistId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(visibility !== undefined && { visibility })
        }
      });

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} updated playlist details for "${updated.name}"`);
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update playlist details', details: err.message });
    }
  }

  if (action === 'sync-artists') {
    try {
      const songs = await prisma.song.findMany({
        select: { artist: true }
      });
      const uniqueArtists = Array.from(new Set(
        songs
          .map(s => s.artist?.trim())
          .filter(name => name && name.toLowerCase() !== 'unknown' && name.toLowerCase() !== 'unknown artist')
      ));

      let insertedCount = 0;
      for (const artistName of uniqueArtists) {
        try {
          const exists = await prisma.artist.findUnique({
            where: { name: artistName }
          });
          if (!exists) {
            await prisma.artist.create({
              data: { name: artistName }
            });
            insertedCount++;
          }
        } catch (e) {
          // Ignore unique constraints
        }
      }

      await logSystemEvent('AUDIT', `Admin ${adminUser.username} triggered Artist database sync-migration. Found ${uniqueArtists.length} unique artists, imported ${insertedCount} new ones.`);
      return res.status(200).json({
        success: true,
        totalFound: uniqueArtists.length,
        newlyImported: insertedCount
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to synchronize artists database', details: err.message });
    }
  }

  if (action === 'get-artists-stats') {
    try {
      const totalArtists = await prisma.artist.count();
      const sampleArtists = await prisma.artist.findMany({
        orderBy: { name: 'asc' },
        take: 15
      });
      return res.status(200).json({
        totalArtists,
        sampleArtists
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch artists stats', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Action not matched or method not supported' });
}
