import type { AuthNotifier } from "../infrastructure/auth-notifier.js";
import type { IUserRepository } from "../infrastructure/user-repository.js";
import type { SessionRepository } from "../infrastructure/session-repository.js";
import { customAlphabet } from "nanoid";

const numericAlphabet = "0123456789";
const generateCode = customAlphabet(numericAlphabet, 6);

export class AuthService {
  constructor(
    private userRepo: IUserRepository,
    private authNotifier: AuthNotifier,
    private sessionRepository: SessionRepository,
    private sessionExpiresIn: number,
  ) {}

  async login(email: string): Promise<{ message: string }> {
    let user = await this.userRepo.findUserByEmail(email);

    if (!user) {
      user = await this.userRepo.createUser(email);
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await this.userRepo.invalidateUserAuthCodes(user._id);

    await this.userRepo.createAuthCode(user._id, code, expiresAt);

    this.authNotifier.notify(email, code);

    return { message: "Verification code sent" };
  }

  async verify(
    email: string,
    code: string,
  ): Promise<{ sessionId: string; user: { userId: string; email: string } }> {
    const authCode = await this.userRepo.findAuthCode(email, code);

    if (!authCode) {
      throw new Error("Invalid or expired code");
    }

    await this.userRepo.markAuthCodeUsed(authCode._id);

    await this.userRepo.updateLastLogin(authCode.userId);

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.sessionExpiresIn);

    await this.sessionRepository.create({
      sessionId,
      userId: authCode.userId.toString(),
      expiresAt,
    });

    const user = await this.userRepo.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      sessionId,
      user: { userId: user._id.toString(), email: user.email },
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepository.deleteBySessionId(sessionId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionRepository.deleteByUserId(userId);
  }
}
