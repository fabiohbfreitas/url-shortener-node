import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import scalarApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import { parseError } from "evlog";
import { evlog } from "evlog/fastify";
import {
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransformers,
  serializerCompiler,
  validatorCompiler,
} from "fastify-zod-openapi";
import type { AppConfig } from "./config.js";
import { registerAuthPlugin } from "./plugins/auth.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerShortLinksRoutes } from "./routes/short-links.js";
import { registerAuthRoutes } from "./routes/auth.js";
import type { DatabaseSync } from "./db.js";

export const buildApp = async (config: AppConfig, database: DatabaseSync) => {
  const app = Fastify({ logger: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(evlog);

  await app.register(fastifyZodOpenApiPlugin);
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "URL Shortener API",
        version: "1.0.0",
        description: "Node.js 24 + Fastify + Zod API foundation with Scalar documentation.",
      },
    },
    ...fastifyZodOpenApiTransformers,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/swagger",
  });

  await app.register(scalarApiReference, {
    routePrefix: "/docs",
  });

  app.get("/openapi.json", { schema: { hide: true } }, async () => app.swagger());

  await app.register(registerAuthPlugin, config);

  await registerAuthRoutes(app, database);
  await registerHealthRoute(app, config.serviceName);
  await registerShortLinksRoutes(app, database);

  app.setErrorHandler((error, _request, reply) => {
    const parsed = parseError(error);
    const status = parsed.status ?? 500;
    return reply.status(status).send({
      message: parsed.message,
      why: parsed.why,
      fix: parsed.fix,
      link: parsed.link,
    });
  });

  return app;
};
