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
import { config as defaultConfig, type AppConfig } from "./config.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerShortLinkRoutes } from "./routes/short-links.js";

export const buildApp = async (config: AppConfig = defaultConfig) => {
  const app = Fastify({ logger: true });

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
        description:
          "Node.js 24 + Fastify + Zod API foundation with Scalar documentation.",
      },
    },
    ...fastifyZodOpenApiTransformers,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: config.swaggerPath,
  });

  await app.register(scalarApiReference, {
    routePrefix: config.docsPath,
  });

  app.get(config.openApiPath, { schema: { hide: true } }, async () => app.swagger());

  await registerHealthRoute(app, config.serviceName);
  await registerShortLinkRoutes(app);

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
