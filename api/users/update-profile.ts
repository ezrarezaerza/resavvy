import type { Response } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export default async function updateProfileHandler(req: AuthRequest, res: Response) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, bio, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true
      }
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
