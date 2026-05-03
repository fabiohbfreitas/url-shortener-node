import { Session } from "../domain/session.js";

export interface SessionRepository {
  create(session: Omit<Session, "createdAt" | "lastUsedAt">): Promise<void>;
  findBySessionId(sessionId: string): Promise<Session | null>;
  updateLastUsed(sessionId: string): Promise<void>;
  deleteBySessionId(sessionId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
