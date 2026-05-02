import type { FastifyInstance } from "fastify";
import { useLogger } from "evlog/fastify";
import type { FastifyZodOpenApiSchema, FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { z } from "zod/v4";
import {
  createShortLink,
  findShortLinkBySlug,
  incrementVisits,
  deleteShortLink,
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
    method: "POST",
    url: "/short-links",
    schema: createShortLinkSchema,
    handler: async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "create-short-link" });

      const { url } = request.body;

      const slug = generateUniqueSlug((s: string) => {
        const existing = findShortLinkBySlug(db, s);
        return existing !== undefined;
      });

      const shortLink = createShortLink(db, slug, url);

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
    handler: async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "get-short-link" });

      const { slug } = request.params;

      const shortLink = findShortLinkBySlug(db, slug);

      if (!shortLink) {
        return reply.status(404).send({
          message: "Short link not found",
        });
      }

      return reply.status(200).send({
        id: shortLink.id,
        slug: shortLink.slug,
        original_url: shortLink.original_url,
        created_at: shortLink.created_at,
        visits: shortLink.visits,
      });
    },
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "DELETE",
    url: "/short-links/:slug",
    schema: deleteShortLinkSchema,
    handler: async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "delete-short-link" });

      const { slug } = request.params;

      const deleted = deleteShortLink(db, slug);

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
