import prisma from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { recordDbQuery } from '@/lib/telemetry';

export class WorkspaceReadRepository {
  async findById(id: string) {
    return cache.getOrSet('workspace', `id:${id}`, async () => {
      const start = Date.now();
      const result = await prisma.workspace.findUnique({
        where: { id },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
          _count: { select: { members: true, boards: true } },
        },
      });
      recordDbQuery('findUnique', 'Workspace', Date.now() - start);
      return result;
    });
  }

  async findByUser(userId: string) {
    return cache.getOrSet('workspace', `user:${userId}`, async () => {
      const start = Date.now();
      const result = await prisma.workspace.findMany({
        where: { members: { some: { userId } } },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
          _count: { select: { members: true, boards: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      recordDbQuery('findMany', 'Workspace', Date.now() - start);
      return result;
    }, 120);
  }

  async findBySlug(slug: string) {
    const start = Date.now();
    const result = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });
    recordDbQuery('findUnique', 'Workspace', Date.now() - start);
    return result;
  }

  async getMember(workspaceId: string, userId: string) {
    const start = Date.now();
    const result = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    recordDbQuery('findUnique', 'WorkspaceMember', Date.now() - start);
    return result;
  }

  async getMembers(workspaceId: string) {
    const start = Date.now();
    const result = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    recordDbQuery('findMany', 'WorkspaceMember', Date.now() - start);
    return result;
  }
}

export const workspaceReadRepo = new WorkspaceReadRepository();
