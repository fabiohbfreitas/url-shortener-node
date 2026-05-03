import { SessionDocument } from "../infrastructure/db.js";
import { SessionRepository } from "./session-repository.js";

export class MongoSessionRepository implements SessionRepository {
  constructor(private Session: any) {}

  async create(session: { sessionId: string; userId: string; expiresAt: Date }): Promise<void> {
    const now = new Date();
    await this.Session.insertOne({
      sessionId: session.sessionId,
      userId: session.userId,
      expiresAt: session.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findBySessionId(sessionId: string): Promise<SessionDocument | null> {
    return this.Session.findOne({ sessionId });
  }

  async updateLastUsed(sessionId: string): Promise<void> {
    await this.Session.updateOne(
      { sessionId },
      { $set: { updatedAt: new Date(), lastUsedAt: new Date() } },
    );
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.Session.deleteOne({ sessionId });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.Session.deleteMany({ userId });
  }
}
