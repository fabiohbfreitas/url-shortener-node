import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTestApp } from "./test-utils/build-test-app.js";
import {
  getTestDatabase,
  initializeDatabase,
  findValidAuthCode,
} from "../infrastructure/database.js";
import { DatabaseSync } from "node:sqlite";

const appsToClose: Array<Awaited<ReturnType<typeof buildTestApp>>> = [];

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

describe("POST /auth/login", () => {
  it("returns 200 and creates user for new email", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "new@example.com" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty("message", "Verification code sent");
  });

  it("returns 200 for existing email (upsert behavior)", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "existing@example.com" },
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "existing@example.com" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty("message", "Verification code sent");
  });

  it("returns 400 for invalid email", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "invalid-email" },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });

  it("does not log code to console in test environment", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com" },
    });

    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("[AUTH CODE] Email: test@example.com | Code:"),
    );

    consoleSpy.mockRestore();
  });

  it("invalidates previous code when requesting new code", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com" },
    });

    const stmt = db.prepare(`
      SELECT ac.code
      FROM auth_codes ac
      JOIN users u ON u.id = ac.user_id
      WHERE u.email = ? AND ac.used_at IS NULL AND ac.expires_at > CURRENT_TIMESTAMP
      ORDER BY ac.created_at DESC
      LIMIT 1
    `);
    const row = stmt.get("test@example.com") as { code: string } | undefined;
    const firstCode = row?.code || "";

    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com" },
    });

    const verifyResponse = await app.inject({
      method: "POST",
      url: "/auth/login/verify",
      payload: { email: "test@example.com", code: firstCode },
    });

    expect(verifyResponse.statusCode).toBe(401);
  });
});

describe("POST /auth/login/verify", () => {
  const getAuthCode = (db: DatabaseSync, email: string) => {
    const stmt = db.prepare(`
      SELECT ac.code
      FROM auth_codes ac
      JOIN users u ON u.id = ac.user_id
      WHERE u.email = ? AND ac.used_at IS NULL AND ac.expires_at > CURRENT_TIMESTAMP
      ORDER BY ac.created_at DESC
      LIMIT 1
    `);
    const row = stmt.get(email) as { code: string } | undefined;
    return row?.code || "";
  };

  it("returns 200 with accessToken for valid code", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com" },
    });

    const code = getAuthCode(db, "test@example.com");

    const response = await app.inject({
      method: "POST",
      url: "/auth/login/verify",
      payload: { email: "test@example.com", code },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty("accessToken");
    expect(typeof body.accessToken).toBe("string");
  });

  it("returns 401 for invalid code", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com" },
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/login/verify",
      payload: { email: "test@example.com", code: "000000" },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body).toHaveProperty("message", "Invalid or expired code");
  });

  it("returns 401 for wrong email", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const requestResponse = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com" },
    });

    expect(requestResponse.statusCode).toBe(200);

    const code = getAuthCode(db, "test@example.com");

    const response = await app.inject({
      method: "POST",
      url: "/auth/login/verify",
      payload: { email: "wrong@example.com", code },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body).toHaveProperty("message", "Invalid or expired code");
  });

  it("returns 400 for invalid email format", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/auth/login/verify",
      payload: { email: "invalid", code: "123456" },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });

  it("returns 400 for invalid code length", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/auth/login/verify",
      payload: { email: "test@example.com", code: "123" },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });
});

describe("Protected routes without authentication", () => {
  it("POST /short-links returns 401 without token", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/short-links",
      payload: { url: "https://example.com" },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body).toHaveProperty("message", "Unauthorized");
  });

  it("GET /short-links/:slug returns 401 without token", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/short-links/test123",
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body).toHaveProperty("message", "Unauthorized");
  });

  it("DELETE /short-links/:slug returns 401 without token", async () => {
    const db = new DatabaseSync(":memory:");
    initializeDatabase(db);
    const app = await buildTestApp({}, db);
    appsToClose.push(app);

    const response = await app.inject({
      method: "DELETE",
      url: "/short-links/test123",
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body).toHaveProperty("message", "Unauthorized");
  });

  it("GET /:slug redirect works without token", async () => {
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

    expect(createResponse.statusCode).toBe(201);
    const { slug } = createResponse.json();

    const response = await app.inject({
      method: "GET",
      url: `/${slug}`,
    });

    expect(response.statusCode).toBe(302);
  });
});

describe("Protected routes with authentication", () => {
  it("POST /short-links returns 201 with valid token", async () => {
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
  });

  it("GET /short-links/:slug returns 200 with valid token", async () => {
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

    expect(createResponse.statusCode).toBe(201);
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
  });
});
