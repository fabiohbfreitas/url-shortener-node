import type { UserDocument, AuthCodeDocument } from "./db.js";

export interface IUserRepository {
  findUserByEmail(email: string): Promise<UserDocument | null>;
  createUser(email: string): Promise<UserDocument>;
  updateLastLogin(userId: string): Promise<void>;
  findAuthCode(email: string, code: string): Promise<(AuthCodeDocument & { email: string }) | null>;
  createAuthCode(userId: string, code: string, expiresAt: string): Promise<void>;
  invalidateUserAuthCodes(userId: string): Promise<void>;
  markAuthCodeUsed(codeId: string): Promise<void>;
}
