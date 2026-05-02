import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod/v4";
import type { FastifyInstance } from "fastify";
import type { DatabaseSync } from "../db.js";
import {
  findOrCreateUser,
  createAuthCode,
  findValidAuthCode,
  markAuthCodeUsed,
  updateUserLastLogin,
  invalidateUserAuthCodes,
} from "../db.js";
import { useLogger } from "evlog/fastify";
import { customAlphabet } from "nanoid";

const numericAlphabet = "0123456789";
const generateCode = customAlphabet(numericAlphabet, 6);

const requestCodeSchema = {
  tags: ["auth"],
  summary: "Request verification code",
  body: z.object({
    email: z.string().email(),
  }),
  response: {
    200: z.object({ message: z.string() }),
    400: z.object({ message: z.string() }),
  },
} satisfies FastifyZodOpenApiSchema;

const verifyCodeSchema = {
  tags: ["auth"],
  summary: "Verify code and get access token",
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
  }),
  response: {
    200: z.object({ accessToken: z.string() }),
    400: z.object({ message: z.string() }),
    401: z.object({ message: z.string() }),
  },
} satisfies FastifyZodOpenApiSchema;

export const registerAuthRoutes = async (
  app: FastifyInstance,
  database: DatabaseSync,
): Promise<void> => {
  const db = database;

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/auth/login",
    schema: requestCodeSchema,
    handler: async (request, reply) => {
      useLogger<{ email?: string }>().set({ email: request.body.email });

      const { email } = request.body;
      const user = findOrCreateUser(db, email);
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      invalidateUserAuthCodes(db, user.id);
      createAuthCode(db, user.id, code, expiresAt);

      if (process.env.NODE_ENV !== "test") {
        console.log(`[AUTH CODE] Email: ${email} | Code: ${code}`);
      }

      return reply.status(200).send({ message: "Verification code sent" });
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/auth/login/verify",
    schema: verifyCodeSchema,
    handler: async (request, reply) => {
      useLogger<{ email?: string }>().set({ email: request.body.email });

      const { email, code } = request.body;

      const authCode = findValidAuthCode(db, email, code);

      if (!authCode) {
        return reply.status(401).send({ message: "Invalid or expired code" });
      }

      markAuthCodeUsed(db, authCode.id);
      updateUserLastLogin(db, authCode.user_id);

      const token = app.jwt.sign({ userId: authCode.user_id, email: authCode.email });

      return reply.status(200).send({ accessToken: token });
    },
  });
};
