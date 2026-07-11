import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  workspaceId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  hash: string;
  previousHash: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private blockchain: AuditEvent[] = [];

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash' | 'previousHash'>): Promise<AuditEvent> {
    const previous = this.blockchain.length > 0
      ? this.blockchain[this.blockchain.length - 1]
      : await this.findLastPersistedHash();

    const previousHash = previous?.hash || '0'.repeat(64);

    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      hash: '',
      previousHash,
    };

    auditEvent.hash = await this.computeHash(auditEvent);
    this.blockchain.push(auditEvent);

    await this.persist(auditEvent);

    return auditEvent;
  }

  private async findLastPersistedHash(): Promise<{ hash: string } | null> {
    try {
      const last = await prisma.immutableAuditLog.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { hash: true },
      });
      return last;
    } catch {
      return null;
    }
  }

  private async persist(event: AuditEvent): Promise<void> {
    try {
      await prisma.immutableAuditLog.create({
        data: {
          id: event.id,
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          userId: event.userId,
          workspaceId: event.workspaceId,
          metadata: event.metadata as Prisma.InputJsonValue,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          hash: event.hash,
          previousHash: event.previousHash,
        },
      });
    } catch (error) {
      console.error('Failed to persist audit event:', error);
    }
  }

  async verifyIntegrity(): Promise<{ valid: boolean; brokenAt?: number }> {
    const persisted = await prisma.immutableAuditLog.findMany({
      orderBy: { timestamp: 'asc' },
    });

    if (persisted.length === 0 && this.blockchain.length === 0) {
      return { valid: true };
    }

    const allEvents = [...persisted, ...this.blockchain.filter(
      (e) => !persisted.find((p) => p.id === e.id),
    )].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 1; i < allEvents.length; i++) {
      const current = allEvents[i];
      const previous = allEvents[i - 1];

      if (current.previousHash !== previous.hash) {
        return { valid: false, brokenAt: i };
      }

      const recomputedHash = await this.computeHash(current as AuditEvent);
      if (current.hash !== recomputedHash) {
        return { valid: false, brokenAt: i };
      }
    }

    return { valid: true };
  }

  getAuditTrail(filters?: {
    userId?: string;
    workspaceId?: string;
    action?: string;
    since?: Date;
  }): AuditEvent[] {
    let trail = [...this.blockchain];
    if (filters) {
      if (filters.userId) trail = trail.filter((e) => e.userId === filters.userId);
      if (filters.workspaceId) trail = trail.filter((e) => e.workspaceId === filters.workspaceId);
      if (filters.action) trail = trail.filter((e) => e.action === filters.action);
      if (filters.since) trail = trail.filter((e) => e.timestamp >= filters.since!);
    }
    return trail;
  }

  private async computeHash(event: AuditEvent): Promise<string> {
    const data = [
      event.id,
      event.action,
      event.entityType,
      event.entityId,
      event.userId,
      event.workspaceId,
      JSON.stringify(event.metadata),
      event.ipAddress || '',
      event.userAgent || '',
      event.timestamp.toISOString(),
      event.previousHash,
    ].join('|');

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

export const auditLogger = AuditLogger.getInstance();
