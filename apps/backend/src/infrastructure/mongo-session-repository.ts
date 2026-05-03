import { SessionDocument } from "./db.js";
import { SessionRepository } from "./session-repository.js";
import type { Collection } from "mongodb";

export class MongoSessionRepository implements SessionRepository {
  constructor(private sessionCollection: Collection) {}

  async create(session: { sessionId: string; userId: string; expiresAt: Date }): Promise<void> {
    const now = new Date();
    await this.sessionCollection.insertOne({
      sessionId: session.sessionId,
      userId: session.userId,
      expiresAt: session.expiresAt,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    });
  }

  async findBySessionId(sessionId: string): Promise<SessionDocument | null> {
    const session = await this.sessionCollection.findOne({ sessionId });
    if (!session) return null;
    return { ...session, _id: session._id.toString() } as SessionDocument;
  }

  async updateLastUsed(sessionId: string): Promise<void> {
    await this.sessionCollection.updateOne(
      { sessionId },
      { $set: { updatedAt: new Date(), lastUsedAt: new Date() } },
    );
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.sessionCollection.deleteOne({ sessionId });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.sessionCollection.deleteMany({ userId });
  }
}
