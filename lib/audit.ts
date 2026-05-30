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
    const previousHash = this.blockchain.length > 0
      ? this.blockchain[this.blockchain.length - 1].hash
      : '0'.repeat(64);

    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      hash: '',
      previousHash,
    };

    auditEvent.hash = await this.computeHash(auditEvent);
    this.blockchain.push(auditEvent);

    return auditEvent;
  }

  async verifyIntegrity(): Promise<{ valid: boolean; brokenAt?: number }> {
    for (let i = 1; i < this.blockchain.length; i++) {
      const current = this.blockchain[i];
      const previous = this.blockchain[i - 1];

      if (current.previousHash !== previous.hash) {
        return { valid: false, brokenAt: i };
      }

      const recomputedHash = await this.computeHash(current);
      if (current.hash !== recomputedHash) {
        return { valid: false, brokenAt: i };
      }
    }

    return { valid: true };
  }

  getAuditTrail(filters?: { userId?: string; workspaceId?: string; action?: string; since?: Date }): AuditEvent[] {
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
    const data = `${event.id}${event.action}${event.entityType}${event.entityId}${event.userId}${event.workspaceId}${JSON.stringify(event.metadata)}${event.ipAddress || ''}${event.userAgent || ''}${event.timestamp.toISOString()}${event.previousHash}`;

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

export const auditLogger = AuditLogger.getInstance();
