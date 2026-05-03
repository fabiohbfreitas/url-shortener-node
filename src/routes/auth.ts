import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod/v4";
import type { FastifyInstance } from "fastify";
import type { AuthService } from "../services/auth-service.js";

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
  authService: AuthService,
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
        const result = await authService.verify(email, code);
        return reply.status(200).send(result);
      } catch {
        return reply.status(401).send({ message: "Invalid or expired code" });
      }
    },
  });
};
