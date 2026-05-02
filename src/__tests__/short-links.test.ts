import { afterEach, describe, expect, it } from "vitest";
import { buildTestApp } from "./test-utils/build-test-app.js";
import { getTestDatabase, initializeDatabase } from "../db.js";
import { DatabaseSync } from "node:sqlite";

const appsToClose: Array<Awaited<ReturnType<typeof buildTestApp>>> = [];

afterEach(async () => {
  await Promise.all(appsToClose.splice(0).map((app) => app.close()));
});

describe("POST /short-links", () => {
  it("creates a short link and returns 201", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty("slug");
    expect(body).toHaveProperty("shortUrl");
    expect(body).toHaveProperty("originalUrl", "https://example.com");
    expect(body.slug).toMatch(/^[a-zA-Z0-9]{6}$/);
  });

  it("returns 400 for invalid URL", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "not-a-url" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /short-links/:slug", () => {
  it("returns short link details", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
    });
    const { slug } = createResponse.json();

    const response = await app.inject({
      method: "GET",
      url: `/short-links/${slug}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.slug).toBe(slug);
    expect(body.original_url).toBe("https://example.com");
    expect(body.visits).toBe(0);
    expect(body).toHaveProperty("created_at");
  });

  it("returns 404 for non-existent slug", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/short-links/nonexistent",
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("GET /:slug (redirect)", () => {
  it("redirects to original URL and increments visits", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
    });
    const { slug } = createResponse.json();

    const response = await app.inject({
      method: "GET",
      url: `/${slug}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("https://example.com");

    const detailsResponse = await app.inject({
      method: "GET",
      url: `/short-links/${slug}`,
    });
    const details = detailsResponse.json();
    expect(details.visits).toBe(1);
  });

  it("returns 404 for non-existent slug", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/nonexistent",
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /short-links/:slug", () => {
  it("deletes a short link and returns 204", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
    });
    const { slug } = createResponse.json();

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/short-links/${slug}`,
    });

    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await app.inject({
      method: "GET",
      url: `/short-links/${slug}`,
    });
    expect(getResponse.statusCode).toBe(404);
  });

  it("returns 404 when deleting non-existent slug", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "DELETE",
      url: "/short-links/nonexistent",
    });

    expect(response.statusCode).toBe(404);
  });
});
