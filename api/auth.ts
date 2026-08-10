import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

function getUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (req.method === 'POST') {
    if (action === 'register') {
      try {
        const { name, username, password } = req.body;
        if (!name || !username || !password) return res.status(400).json({ error: 'Missing fields' });
        
        // Check if registration is paused globally
        const registrationConfig = await prisma.systemConfig.findUnique({ where: { key: 'DISABLE_REGISTRATION' } });
        if (registrationConfig && registrationConfig.value === 'true') {
          return res.status(403).json({ error: 'Registration is temporarily paused by administration.' });
        }

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return res.status(409).json({ error: 'Username taken' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // First user gets ADMIN role, subsequent get USER
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? 'ADMIN' : 'USER';

        const user = await prisma.user.create({ data: { name, username, passwordHash, role } });
        const token = jwt.sign({ id: user.id, name: user.name, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({ token, user: { id: user.id, name: user.name, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl, role: user.role, status: user.status } });
      } catch (err) {
        return res.status(500).json({ error: 'Registration failed' });
      }
    }

    if (action === 'login') {
      try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

        let user = await prisma.user.findUnique({ where: { username } });

        // Auto-seed admin user on development if admin/admin is requested and doesn't exist
        if (!user && username === 'admin' && password === 'admin') {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash('admin', salt);
          user = await prisma.user.create({
            data: {
              name: 'System Administrator',
              username: 'admin',
              passwordHash,
              role: 'ADMIN'
            }
          });
        }

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        // Check moderation status
        if (user.status === 'BANNED') {
          return res.status(403).json({ error: 'Your account has been permanently banned for violating community standards.' });
        }
        if (user.status === 'SUSPENDED') {
          if (user.suspensionExpiresAt && new Date() > new Date(user.suspensionExpiresAt)) {
            // Suspension expired - restore ACTIVE status
            user = await prisma.user.update({
              where: { id: user.id },
              data: { status: 'ACTIVE', suspensionExpiresAt: null }
            });
          } else {
            const dateStr = user.suspensionExpiresAt ? new Date(user.suspensionExpiresAt).toLocaleDateString() : 'indefinitely';
            return res.status(403).json({ error: `Your account is temporarily suspended until ${dateStr}. Warning message: ${user.moderationWarning || 'No warning details provided.'}` });
          }
        }

        const token = jwt.sign({ id: user.id, name: user.name, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({ token, user: { id: user.id, name: user.name, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl, role: user.role, status: user.status } });
      } catch (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
    }
  }

  if (req.method === 'GET' && action === 'me') {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Check moderation status on session restoration
      if (user.status === 'BANNED') {
        return res.status(403).json({ error: 'Your account has been permanently banned for violating community standards.' });
      }
      if (user.status === 'SUSPENDED') {
        if (user.suspensionExpiresAt && new Date() > new Date(user.suspensionExpiresAt)) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { status: 'ACTIVE', suspensionExpiresAt: null }
          });
        } else {
          const dateStr = user.suspensionExpiresAt ? new Date(user.suspensionExpiresAt).toLocaleDateString() : 'indefinitely';
          return res.status(403).json({ error: `Your account is temporarily suspended until ${dateStr}.` });
        }
      }

      return res.status(200).json({ id: user.id, name: user.name, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl, role: user.role, status: user.status, moderationWarning: user.moderationWarning });
    } catch {
      return res.status(500).json({ error: 'Failed to find user' });
    }
  }

  if (req.method === 'PUT' && action === 'update-profile') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
          return res.status(403).json({ error: 'Your account is currently suspended or banned. Profile edits are disabled.' });
        }

        const { name, displayName, bio, avatarUrl } = req.body;
        const updatedName = displayName || name;
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
             ...(updatedName !== undefined && { name: updatedName }),
             ...(bio !== undefined && { bio }),
             ...(avatarUrl !== undefined && { avatarUrl }),
          },
          select: { id: true, name: true, username: true, bio: true, avatarUrl: true }
        });
        return res.status(200).json(updated);
      } catch (err) {
         return res.status(500).json({ error: 'Failed to update profile' });
      }
  }

  if (req.method === 'DELETE' && action === 'delete-account') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      try {
        await prisma.user.delete({
          where: { id: userId }
        });
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: 'Failed to delete account' });
      }
  }

  if (req.method === 'POST' && action === 'acknowledge-warning') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { moderationWarning: null },
          select: { id: true, name: true, username: true, bio: true, avatarUrl: true, role: true, status: true, moderationWarning: true }
        });
        return res.status(200).json(updated);
      } catch (err) {
        return res.status(500).json({ error: 'Failed to acknowledge warning' });
      }
  }

  if (req.method === 'GET' && action === 'system-config') {
    const defaultConfig = [
      { key: "MAINTENANCE_MODE", value: "false" },
      { key: "SYSTEM_ALERT_BANNER", value: "" },
      { key: "MAX_SONGS_PER_PLAYLIST", value: "100" },
      { key: "ENABLE_COMMUNITY_POSTS", value: "true" },
      { key: "SYSTEM_PROMO_INTERVAL", value: "6" }
    ];
    try {
      const configs = await prisma.systemConfig.findMany();
      if (configs && configs.length > 0) {
        return res.status(200).json(configs);
      }
      return res.status(200).json(defaultConfig);
    } catch (err) {
      console.warn('Fallback system config used due to DB error:', err);
      return res.status(200).json(defaultConfig);
    }
  }

  return res.status(405).json({ error: 'Method not allowed or invalid action' });
}
