import { afterEach, describe, expect, it, beforeEach } from "vitest";
import { buildTestApp } from "./test-utils/build-test-app.js";
import {
  getTestDatabase,
  initializeDatabase,
  findValidAuthCode,
} from "../infrastructure/database.js";
import { DatabaseSync } from "node:sqlite";

const appsToClose: Array<Awaited<ReturnType<typeof buildTestApp>>> = [];
let authToken: string = "";

afterEach(async () => {
  await Promise.all(appsToClose.splice(0).map((app) => app.close()));
});

const getAuthToken = async (app: any, db: DatabaseSync, email: string) => {
  await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email },
  });

  const stmt = db.prepare(`
    SELECT ac.code
    FROM auth_codes ac
    JOIN users u ON u.id = ac.user_id
    WHERE u.email = ? AND ac.used_at IS NULL AND ac.expires_at > CURRENT_TIMESTAMP
    ORDER BY ac.created_at DESC
    LIMIT 1
  `);
  const row = stmt.get(email) as { code: string } | undefined;
  const code = row?.code || "";

  const verifyResponse = await app.inject({
    method: "POST",
    url: "/auth/login/verify",
    payload: { email, code },
  });

  const { accessToken } = verifyResponse.json();
  return accessToken;
};

describe("POST /short-links", () => {
  it("creates a short link and returns 201", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const response = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
      headers: {
        authorization: `Bearer ${token}`,
      },
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

    const token = await getAuthToken(app, db, "test@example.com");

    const response = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "not-a-url" },
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect(body.message).toContain("url");
  });

  it("returns 400 for missing URL in request body", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const response = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: {},
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect(body.message).toContain("url");
  });

  it("returns 400 for non-string URL", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const response = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: 123 },
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect(body.message).toContain("url");
  });
});

describe("GET /short-links/:slug", () => {
  it("returns short link details", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const createResponse = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const { slug } = createResponse.json();

    const response = await app.inject({
      method: "GET",
      url: `/short-links/${slug}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
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

    const token = await getAuthToken(app, db, "test@example.com");

    const response = await app.inject({
      method: "GET",
      url: "/short-links/nonexistent",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body).toHaveProperty("message", "Short link not found");
    expect(typeof body.message).toBe("string");
  });
});

describe("GET /:slug (redirect)", () => {
  it("redirects to original URL and increments visits", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const createResponse = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
      headers: {
        authorization: `Bearer ${token}`,
      },
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
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const details = detailsResponse.json();
    expect(details.visits).toBe(1);
  });

  it("returns 404 for non-existent slug", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const response = await app.inject({
      method: "GET",
      url: "/nonexistent",
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body).toHaveProperty("message", "Short link not found");
    expect(typeof body.message).toBe("string");
  });
});

describe("DELETE /short-links/:slug", () => {
  it("deletes a short link and returns 204", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const createResponse = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const { slug } = createResponse.json();

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/short-links/${slug}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await app.inject({
      method: "GET",
      url: `/short-links/${slug}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(getResponse.statusCode).toBe(404);
  });

  it("returns 404 when deleting non-existent slug", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const response = await app.inject({
      method: "DELETE",
      url: "/short-links/nonexistent",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body).toHaveProperty("message", "Short link not found");
    expect(typeof body.message).toBe("string");
  });
});

describe("GET /short-links", () => {
  it("lists short links with default pagination", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com/1" },
      headers: { authorization: `Bearer ${token}` },
    });

    await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com/2" },
      headers: { authorization: `Bearer ${token}` },
    });

    const response = await app.inject({
      method: "GET",
      url: "/short-links",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(2);
    const urls = body.items.map((item: any) => item.original_url);
    expect(urls).toContain("https://example.com/1");
    expect(urls).toContain("https://example.com/2");
  });

  it("respects custom page and limit parameters", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    for (let i = 0; i < 15; i++) {
      await app.inject({
        method: "POST",
        url: "/short-links",
        payload: { url: `https://example.com/${i}` },
        headers: { authorization: `Bearer ${token}` },
      });
    }

    const response = await app.inject({
      method: "GET",
      url: "/short-links?page=2&limit=5",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.items).toHaveLength(5);
    expect(body.total).toBe(15);
  });

  it("caps limit to 50", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    for (let i = 0; i < 55; i++) {
      await app.inject({
        method: "POST",
        url: "/short-links",
        payload: { url: `https://example.com/${i}` },
        headers: { authorization: `Bearer ${token}` },
      });
    }

    const response = await app.inject({
      method: "GET",
      url: "/short-links?limit=100",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.items).toHaveLength(50);
    expect(body.total).toBe(55);
  });

  it("does not return short links from other users", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const tokenA = await getAuthToken(app, db, "user-a@example.com");
    const tokenB = await getAuthToken(app, db, "user-b@example.com");

    await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://user-a.com" },
      headers: { authorization: `Bearer ${tokenA}` },
    });

    const response = await app.inject({
      method: "GET",
      url: "/short-links",
      headers: { authorization: `Bearer ${tokenB}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.items).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it("returns empty list when user has no short links", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const token = await getAuthToken(app, db, "test@example.com");

    const response = await app.inject({
      method: "GET",
      url: "/short-links",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.items).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});

describe("Owner-only access", () => {
  it("GET /short-links/:slug returns 404 for non-owned link", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const tokenA = await getAuthToken(app, db, "user-a@example.com");
    const tokenB = await getAuthToken(app, db, "user-b@example.com");

    const createResponse = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://user-a.com" },
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const { slug } = createResponse.json();

    const response = await app.inject({
      method: "GET",
      url: `/short-links/${slug}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it("DELETE /short-links/:slug returns 404 for non-owned link", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const tokenA = await getAuthToken(app, db, "user-a@example.com");
    const tokenB = await getAuthToken(app, db, "user-b@example.com");

    const createResponse = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://user-a.com" },
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const { slug } = createResponse.json();

    const response = await app.inject({
      method: "DELETE",
      url: `/short-links/${slug}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });

    expect(response.statusCode).toBe(404);
  });
});
