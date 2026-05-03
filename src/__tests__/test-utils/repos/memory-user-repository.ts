import type { UserDocument, AuthCodeDocument } from "./db.js";
import type { IUserRepository } from "./user-repository.js";

export class MemoryUserRepository implements IUserRepository {
  private users: UserDocument[] = [];
  private authCodes: AuthCodeDocument[] = [];
  private idCounter = 1;

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  async createUser(email: string): Promise<UserDocument> {
    const now = new Date();
    const user: UserDocument = {
      _id: String(this.idCounter++),
      email,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(user);
    return user;
  }

  async findAuthCode(email: string, code: string): Promise<(AuthCodeDocument & { email: string }) | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const now = new Date();
    const found = this.authCodes.find(
      (ac) =>
        ac.userId === user!._id &&
        ac.code === code &&
        !ac.usedAt &&
        new Date(ac.expiresAt) > now
    );

    if (!found) return null;
    return { ...found, email: user.email };
  }

  async invalidateUserAuthCodes(userId: string): Promise<void> {
    for (const authCode of this.authCodes) {
      if (authCode.userId === userId && !authCode.usedAt) {
        authCode.usedAt = new Date().toISOString() as any;
      }
    }
  }

  async createAuthCode(userId: string, code: string, expiresAt: string): Promise<void> {
    const authCode: AuthCodeDocument = {
      _id: String(this.idCounter++),
      userId,
      code,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.authCodes.push(authCode);
  }

  async markAuthCodeUsed(codeId: string): Promise<void> {
    const authCode = this.authCodes.find((ac) => ac._id === codeId);
    if (authCode) {
      authCode.usedAt = new Date().toISOString() as any;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    const user = this.users.find((u) => u._id === userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString() as any;
    }
  }

  cleanup() {
    this.users = [];
    this.authCodes = [];
    this.idCounter = 1;
  }
}
