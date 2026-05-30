import prisma from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { createChildLogger } from '@/lib/logger';
import { DomainEvent, DomainEventType } from '@/lib/events';
import { eventBus } from '@/lib/event-bus';
import { recordDbQuery } from '@/lib/telemetry';

const log = createChildLogger('workspace-commands');

export interface CreateWorkspaceCommand {
  name: string;
  description?: string;
  logo?: string;
  ownerId: string;
}

export interface UpdateWorkspaceCommand {
  id: string;
  name?: string;
  description?: string | null;
  logo?: string | null;
  userId: string;
}

export interface DeleteWorkspaceCommand {
  id: string;
  userId: string;
}

export interface AddMemberCommand {
  workspaceId: string;
  userId: string;
  role?: string;
  addedBy: string;
}

export class WorkspaceCommandRepository {
  async create(cmd: CreateWorkspaceCommand) {
    const start = Date.now();
    const result = await prisma.workspace.create({
      data: {
        name: cmd.name,
        slug: cmd.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        description: cmd.description,
        logo: cmd.logo,
        ownerId: cmd.ownerId,
        members: {
          create: { userId: cmd.ownerId, role: 'OWNER' },
        },
      },
    });
    recordDbQuery('create', 'Workspace', Date.now() - start);

    await cache.invalidate('workspace', `user:${cmd.ownerId}`);
    await cache.invalidate('workspace', `id:${result.id}`);

    await eventBus.publish({
      type: DomainEventType.WORKSPACE_CREATED,
      aggregateId: result.id,
      aggregateType: 'Workspace',
      payload: { name: result.name, ownerId: cmd.ownerId },
      metadata: { userId: cmd.ownerId, workspaceId: result.id, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'WorkspaceCommandRepository' },
    });

    return result;
  }

  async update(cmd: UpdateWorkspaceCommand) {
    const start = Date.now();
    const result = await prisma.workspace.update({
      where: { id: cmd.id },
      data: { name: cmd.name, description: cmd.description, logo: cmd.logo },
    });
    recordDbQuery('update', 'Workspace', Date.now() - start);

    await cache.invalidatePattern('workspace', cmd.id);

    await eventBus.publish({
      type: DomainEventType.WORKSPACE_UPDATED,
      aggregateId: result.id,
      aggregateType: 'Workspace',
      payload: { name: result.name },
      metadata: { userId: cmd.userId, workspaceId: cmd.id, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'WorkspaceCommandRepository' },
    });

    return result;
  }

  async delete(cmd: DeleteWorkspaceCommand) {
    const start = Date.now();
    const result = await prisma.workspace.delete({ where: { id: cmd.id } });
    recordDbQuery('delete', 'Workspace', Date.now() - start);

    await cache.invalidateNamespace('workspace');

    await eventBus.publish({
      type: DomainEventType.WORKSPACE_DELETED,
      aggregateId: cmd.id,
      aggregateType: 'Workspace',
      payload: { name: result.name },
      metadata: { userId: cmd.userId, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'WorkspaceCommandRepository' },
    });

    return result;
  }

  async addMember(cmd: AddMemberCommand) {
    const start = Date.now();
    const member = await prisma.workspaceMember.create({
      data: { workspaceId: cmd.workspaceId, userId: cmd.userId, role: cmd.role as any || 'MEMBER' },
    });
    recordDbQuery('create', 'WorkspaceMember', Date.now() - start);

    await cache.invalidate('workspace', `id:${cmd.workspaceId}`);
    await cache.invalidate('workspace', `user:${cmd.userId}`);

    await eventBus.publish({
      type: DomainEventType.MEMBER_JOINED,
      aggregateId: cmd.userId,
      aggregateType: 'User',
      payload: { workspaceId: cmd.workspaceId, memberName: '', memberId: cmd.userId, addedBy: cmd.addedBy },
      metadata: { userId: cmd.addedBy, workspaceId: cmd.workspaceId, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'WorkspaceCommandRepository' },
    });

    return member;
  }
}

export const workspaceCommandRepo = new WorkspaceCommandRepository();
