import { FastifyRequest, FastifyReply } from "fastify";
import { SessionRepository } from "../infrastructure/session-repository.js";
import { IUserRepository } from "../infrastructure/user-repository.js";

export async function authenticateSession(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const sessionId = request.cookies?.sessionId;
  if (!sessionId) {
    return reply.code(401).send({ message: "No session cookie" });
  }

  const sessionRepository = (request.server as any).sessionRepository as SessionRepository;
  const userRepository = (request.server as any).userRepository as IUserRepository;

  const session = await sessionRepository.findBySessionId(sessionId);
  if (!session || session.expiresAt < new Date()) {
    reply.clearCookie("sessionId");
    return reply.code(401).send({ message: "Invalid or expired session" });
  }

  const user = await userRepository.findById(session.userId);
  if (!user) {
    return reply.code(401).send({ message: "User not found" });
  }

  request.user = { userId: user._id.toString(), email: user.email };

  await sessionRepository.updateLastUsed(sessionId);
}
