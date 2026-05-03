import { SessionRepository } from "../../infrastructure/session-repository.js";
import type { Session } from "../../domain/session.js";

export class MemorySessionRepository implements SessionRepository {
  private sessions: Map<string, Session> = new Map();

  async create(session: Omit<Session, "createdAt" | "lastUsedAt">): Promise<void> {
    const now = new Date();
    this.sessions.set(session.sessionId, {
      ...session,
      createdAt: now,
      lastUsedAt: now,
    } as Session);
  }

  async findBySessionId(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    return session || null;
  }

  async updateLastUsed(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastUsedAt = new Date();
    }
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }
  }

  cleanup(): void {
    this.sessions.clear();
  }
}
