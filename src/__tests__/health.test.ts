import { afterEach, describe, expect, it } from "vitest";
import { buildTestApp } from "./test-utils/build-test-app.js";

const appsToClose: Array<Awaited<ReturnType<typeof buildTestApp>>> = [];

afterEach(async () => {
  await Promise.all(appsToClose.splice(0).map((app) => app.close()));
});

describe("GET /health", () => {
  it("returns service health payload", async () => {
    const app = await buildTestApp({ serviceName: "health-suite" });
    appsToClose.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "health-suite",
    });
  });
});
