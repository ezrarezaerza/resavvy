import { prisma } from '../../src/lib/prisma.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export async function logSystemEvent(level: 'INFO' | 'WARNING' | 'ERROR' | 'AUDIT', message: string, details?: string) {
  try {
    await prisma.systemLog.create({
      data: { level, message, details }
    });
  } catch (err) {
    console.error('Failed to log system event:', err);
  }
}

export async function recordQuotaUsage(quotaUsed: number) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await prisma.apiQuotaUsage.upsert({
      where: { date: today },
      update: {
        requests: { increment: 1 },
        quotaUsed: { increment: quotaUsed }
      },
      create: {
        date: today,
        requests: 1,
        quotaUsed
      }
    });
  } catch (err) {
    console.error('Failed to record quota usage:', err);
  }
}

export async function checkAdmin(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return null;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return null;
    }
    if (user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return null;
  }
}
