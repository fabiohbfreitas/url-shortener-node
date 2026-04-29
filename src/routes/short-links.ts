import type { FastifyInstance } from "fastify";
import { createError } from "evlog";
import { useLogger } from "evlog/fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";
import { z } from "zod/v4";

const previewBodySchema = z.object({
  url: z.string().url(),
});

const previewResponseSchema = z.object({
  slug: z.string(),
  normalizedUrl: z.string().url(),
});

const apiErrorSchema = z.object({
  message: z.string(),
  why: z.string().optional(),
  fix: z.string().optional(),
  link: z.string().optional(),
});

const buildSlug = (url: URL): string => {
  const candidate = `${url.hostname}${url.pathname}`.replace(/[^a-zA-Z0-9]/g, "");
  return candidate.slice(0, 8).toLowerCase() || "shortly";
};

const previewShortLink = (inputUrl: string) => {
  const log = useLogger<{ shortLink?: { host: string; slug: string } }>();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(inputUrl);
  } catch {
    throw createError({
      message: "Invalid URL payload",
      status: 400,
      why: "The provided `url` field is not a valid absolute URL.",
      fix: "Provide a fully-qualified URL such as https://example.com/path.",
      link: "https://developer.mozilla.org/en-US/docs/Web/API/URL/URL",
    });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw createError({
      message: "Unsupported URL protocol",
      status: 422,
      why: "Only HTTP(S) URLs can be shortened.",
      fix: "Use a URL starting with http:// or https://.",
      link: "https://url.spec.whatwg.org/",
    });
  }

  const slug = buildSlug(parsedUrl);
  log.set({
    shortLink: {
      host: parsedUrl.hostname,
      slug,
    },
  });

  return {
    slug,
    normalizedUrl: parsedUrl.toString(),
  };
};

export const registerShortLinkRoutes = async (
  app: FastifyInstance,
): Promise<void> => {
  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/short-links/preview",
    schema: {
      tags: ["short-links"],
      summary: "Preview short-link metadata",
      body: previewBodySchema,
      response: {
        200: previewResponseSchema,
        400: apiErrorSchema,
        422: apiErrorSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async (request, reply) => {
      useLogger<{ route?: string }>().set({ route: "short-links-preview" });
      const result = previewShortLink(request.body.url);
      return reply.code(200).send(result);
    },
  });
};
