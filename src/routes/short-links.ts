import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema, FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { z } from "zod/v4";
import type { ShortLinkService } from "../services/short-link-service.js";
import { ShortLinkSchema } from "../domain/short-link.js";
import { authenticateSession } from "../plugins/session.js";

const createShortLinkSchema = {
  tags: ["short-links"],
  summary: "Create a new short link",
  security: [{ cookieAuth: [] }],
  body: z.object({
    url: z.string().url(),
  }),
  response: {
    201: z.object({
      slug: z.string(),
      shortUrl: z.string().url(),
      originalUrl: z.string().url(),
    }),
    400: z.object({
      message: z.string(),
      why: z.string().optional(),
      fix: z.string().optional(),
      link: z.string().optional(),
    }),
    401: z.object({ message: z.string() }),
  },
} satisfies FastifyZodOpenApiSchema;

const getShortLinkSchema = {
  tags: ["short-links"],
  summary: "Get short link details",
  security: [{ cookieAuth: [] }],
  params: z.object({
    slug: z.string(),
  }),
  response: {
    200: ShortLinkSchema,
    401: z.object({ message: z.string() }),
    404: z.object({
      message: z.string(),
    }),
  },
} satisfies FastifyZodOpenApiSchema;

const deleteShortLinkSchema = {
  tags: ["short-links"],
  summary: "Delete a short link",
  security: [{ cookieAuth: [] }],
  params: z.object({
    slug: z.string(),
  }),
  response: {
    204: z.object({}).optional(),
    401: z.object({ message: z.string() }),
    404: z.object({
      message: z.string(),
    }),
  },
} satisfies FastifyZodOpenApiSchema;

export const registerShortLinksRoutes = async (
  app: FastifyInstance,
  shortLinkService: ShortLinkService,
): Promise<void> => {
  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "GET",
    url: "/short-links",
    schema: {
      tags: ["short-links"],
      summary: "List short links for authenticated user",
      security: [{ cookieAuth: [] }],
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).default(10),
      }),
      response: {
        200: z.object({
          items: z.array(ShortLinkSchema),
          total: z.number().int().min(0),
        }),
        401: z.object({ message: z.string() }),
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: authenticateSession,
    handler: async (request, reply) => {
      const userId = request.user.userId;
      const page = request.query.page;
      const limit = request.query.limit;

      const result = await shortLinkService.list(userId, page, limit);

      return reply.status(200).send(result);
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/short-links",
    schema: createShortLinkSchema,
    preHandler: authenticateSession,
    handler: async (request, reply) => {
      const { url } = request.body;
      const userId = request.user.userId;

      const result = await shortLinkService.create(url, userId, request.protocol, request.host);

      return reply.status(201).send(result);
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "GET",
    url: "/short-links/:slug",
    schema: getShortLinkSchema,
    preHandler: authenticateSession,
    handler: async (request, reply) => {
      const { slug } = request.params;
      const userId = request.user.userId;

      const shortLink = await shortLinkService.get(slug, userId);

      if (!shortLink) {
        return reply.status(404).send({
          message: "Short link not found",
        });
      }

      return reply.status(200).send(shortLink);
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "DELETE",
    url: "/short-links/:slug",
    schema: deleteShortLinkSchema,
    preHandler: authenticateSession,
    handler: async (request, reply) => {
      const { slug } = request.params;
      const userId = request.user.userId;

      const deleted = await shortLinkService.delete(slug, userId);

      if (!deleted) {
        return reply.status(404).send({
          message: "Short link not found",
        });
      }

      return reply.status(204).send({});
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    "/:slug",
    {
      schema: {
        tags: ["short-links"],
        summary: "Redirect to original URL",
        params: z.object({
          slug: z.string(),
        }),
        response: {
          302: z.object({}).optional(),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params;

      const result = await shortLinkService.redirect(slug);

      if ("status" in result && result.status === 404) {
        return reply.status(404).send({ message: result.message });
      }

      return reply.redirect((result as { originalUrl: string }).originalUrl, 302);
    },
  );
};
