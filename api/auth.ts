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
        
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return res.status(409).json({ error: 'Username taken' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({ data: { name, username, passwordHash } });
        const token = jwt.sign({ id: user.id, name: user.name, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({ token, user: { id: user.id, name: user.name, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl } });
      } catch (err) {
        return res.status(500).json({ error: 'Registration failed' });
      }
    }

    if (action === 'login') {
      try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, name: user.name, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({ token, user: { id: user.id, name: user.name, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl } });
      } catch (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
    }
  }

  if (req.method === 'GET' && action === 'me') {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ id: user.id, name: user.name, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl });
    } catch {
      return res.status(500).json({ error: 'Failed to find user' });
    }
  }

  if (req.method === 'PUT' && action === 'update-profile') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
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

  return res.status(405).json({ error: 'Method not allowed or invalid action' });
}
