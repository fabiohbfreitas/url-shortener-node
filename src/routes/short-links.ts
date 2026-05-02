import type { FastifyInstance } from "fastify";
import { useLogger } from "evlog/fastify";
import type { FastifyZodOpenApiSchema, FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { z } from "zod/v4";
import {
  createShortLink,
  findShortLinkBySlug,
  findShortLinkBySlugAndUserId,
  incrementVisits,
  deleteShortLinkBySlugAndUserId,
  listShortLinksByUserId,
  ShortLinkSchema,
} from "../db.js";
import { generateUniqueSlug } from "../utils/slug.js";

const createShortLinkSchema = {
  tags: ["short-links"],
  summary: "Create a short link",
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
  params: z.object({
    slug: z.string(),
  }),
  response: {
    204: z.null().optional(),
    401: z.object({ message: z.string() }),
    404: z.object({
      message: z.string(),
    }),
  },
} satisfies FastifyZodOpenApiSchema;

export const registerShortLinksRoutes = async (
  app: FastifyInstance,
  database: Parameters<(typeof import("../db.js"))["createShortLink"]>[0],
): Promise<void> => {
  const db = database;

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "GET",
    url: "/short-links",
    schema: {
      tags: ["short-links"],
      summary: "List short links for authenticated user",
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
    preHandler: app.authenticate,
    handler: async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "list-short-links" });

      const userId = request.user.userId;
      const page = request.query.page;
      const limit = Math.min(request.query.limit, 50);

      const result = listShortLinksByUserId(db, userId, page, limit);

      return reply.status(200).send(result);
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/short-links",
    schema: createShortLinkSchema,
    preHandler: app.authenticate,
    handler: async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "create-short-link" });

      const { url } = request.body;
      const userId = request.user.userId;

      const slug = generateUniqueSlug((s: string) => {
        const existing = findShortLinkBySlug(db, s);
        return existing !== undefined;
      });

      const shortLink = createShortLink(db, slug, url, userId);

      const protocol = request.protocol;
      const host = request.host;
      const shortUrl = `${protocol}://${host}/${slug}`;

      return reply.status(201).send({
        slug: shortLink.slug,
        shortUrl,
        originalUrl: shortLink.original_url,
      });
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "GET",
    url: "/short-links/:slug",
    schema: getShortLinkSchema,
    preHandler: app.authenticate,
    handler: async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "get-short-link" });

      const { slug } = request.params;
      const userId = request.user.userId;

      const shortLink = findShortLinkBySlugAndUserId(db, slug, userId);

      if (!shortLink) {
        return reply.status(404).send({
          message: "Short link not found",
        });
      }

      return reply.status(200).send({
        id: shortLink.id,
        slug: shortLink.slug,
        original_url: shortLink.original_url,
        user_id: shortLink.user_id,
        created_at: shortLink.created_at,
        visits: shortLink.visits,
      });
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "DELETE",
    url: "/short-links/:slug",
    schema: deleteShortLinkSchema,
    preHandler: app.authenticate,
    handler: async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "delete-short-link" });

      const { slug } = request.params;
      const userId = request.user.userId;

      const deleted = deleteShortLinkBySlugAndUserId(db, slug, userId);

      if (!deleted) {
        return reply.status(404).send({
          message: "Short link not found",
        });
      }

      return reply.status(204).send(null);
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    "/:slug",
    {
      schema: {
        tags: ["redirect"],
        summary: "Redirect to original URL",
        params: z.object({
          slug: z.string(),
        }),
        response: {
          302: z.object({}).optional(),
          404: z.object({
            message: z.string(),
          }),
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "redirect" });

      const { slug } = request.params;

      const shortLink = findShortLinkBySlug(db, slug);

      if (!shortLink) {
        return reply.status(404).send({
          message: "Short link not found",
        });
      }

      incrementVisits(db, slug);

      const originalUrl = shortLink.original_url as string;
      return reply.redirect(originalUrl, 302);
    },
  );
};
