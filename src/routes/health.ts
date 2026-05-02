import type { FastifyInstance } from "fastify";
import { useLogger } from "evlog/fastify";
import type { FastifyZodOpenApiSchema, FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { z } from "zod/v4";

export const registerHealthRoute = async (
  app: FastifyInstance,
  serviceName: string,
): Promise<void> => {
  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "GET",
    url: "/health",
    schema: {
      tags: ["system"],
      summary: "Health check",
      response: {
        200: z.object({
          ok: z.literal(true),
          service: z.string(),
        }),
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async () => {
      useLogger<{ route?: string }>().set({ route: "health" });
      return { ok: true as const, service: serviceName };
    },
  });
};
