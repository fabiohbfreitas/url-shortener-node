import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod/v4";
import type { FastifyInstance } from "fastify";
import type { AuthService } from "../services/auth-service.js";
import { authenticateSession } from "../plugins/session.js";

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
  summary: "Verify code and set session cookie",
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
  }),
  response: {
    200: {
      description: "Successfully authenticated. Session cookie set in Set-Cookie header.",
      headers: {
        "Set-Cookie": {
          schema: { type: "string" },
          description: "sessionId=<uuid>; HttpOnly; Secure; SameSite=Strict",
        },
      },
      content: {
        "application/json": {
          schema: z.object({
            user: z.object({
              userId: z.string(),
              email: z.string(),
            }),
          }),
        },
      },
    },
    400: z.object({ message: z.string() }),
    401: z.object({ message: z.string() }),
  },
} satisfies FastifyZodOpenApiSchema;

const meSchema = {
  tags: ["auth"],
  summary: "Get current user info",
  security: [{ cookieAuth: [] }],
  response: {
    200: z.object({
      userId: z.string(),
      email: z.string(),
    }),
    401: z.object({ message: z.string() }),
  },
} satisfies FastifyZodOpenApiSchema;

const logoutSchema = {
  tags: ["auth"],
  summary: "Logout and clear session",
  security: [{ cookieAuth: [] }],
  response: {
    200: z.object({ message: z.string() }),
    401: z.object({ message: z.string() }),
  },
} satisfies FastifyZodOpenApiSchema;

export const registerAuthRoutes = async (
  app: FastifyInstance,
  authService: AuthService,
  config: { cookieSecure: boolean; sameSite: "strict" | "lax"; sessionExpiresIn: number },
): Promise<void> => {
  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/auth/login",
    schema: requestCodeSchema,
    handler: async (request, reply) => {
      const { email } = request.body;
      const result = await authService.login(email);
      return reply.status(200).send(result);
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/auth/verify",
    schema: verifyCodeSchema,
    handler: async (request, reply) => {
      const { email, code } = request.body;

      try {
        const { sessionId, user } = await authService.verify(email, code);

        reply.setCookie("sessionId", sessionId, {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: config.sameSite,
          maxAge: config.sessionExpiresIn,
          path: "/",
        });

        return reply.status(200).send({ user });
      } catch {
        return reply.status(401).send({ message: "Invalid or expired code" });
      }
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "GET",
    url: "/auth/me",
    schema: meSchema,
    preHandler: authenticateSession,
    handler: async (request, reply) => {
      return reply.status(200).send({
        userId: request.user.userId,
        email: request.user.email,
      });
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/auth/logout",
    schema: logoutSchema,
    preHandler: authenticateSession,
    handler: async (request, reply) => {
      const sessionId = request.cookies?.sessionId;
      if (sessionId) {
        await authService.logout(sessionId);
        reply.clearCookie("sessionId");
      }
      return reply.status(200).send({ message: "Logged out successfully" });
    },
  });
};
