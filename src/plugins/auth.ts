import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AppConfig } from "../config.js";

export const registerAuthPlugin = fp(async (app: FastifyInstance, config: AppConfig) => {
  await app.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  app.decorate(
    "authenticate",
    async function (this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ message: "Unauthorized" });
      }
    },
  );
});
