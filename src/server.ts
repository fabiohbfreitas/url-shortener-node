import { initLogger } from "evlog";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { getDatabase } from "./db.js";

const start = async (): Promise<void> => {
  initLogger({
    env: {
      service: config.serviceName,
      environment: config.nodeEnv,
    },
  });

  const db = getDatabase();
  const app = await buildApp(config, db);

  try {
    await app.listen({
      host: config.host,
      port: config.port,
    });
    app.log.info(
      `Server running at http://${config.host}:${config.port} (docs: ${config.docsPath}, openapi: ${config.openApiPath})`,
    );
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
};

void start();
