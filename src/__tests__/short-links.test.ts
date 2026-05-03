import { beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "./test-utils/build-test-app.js";

interface AuthResponse {
  accessToken: string;
}

interface ShortLinkResponse {
  slug: string;
  shortUrl: string;
  originalUrl: string;
}

interface ListResponse {
  items: Array<{ slug: string; originalUrl: string; visits: number }>;
  total: number;
}

const BASE_URL = "http://127.0.0.1:3001";

async function loginAndVerify(app: TestApp, email: string): Promise<string> {
  await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email },
  });

  const code = app.testAuthNotifier.lastCode;

  const verifyResponse = await app.inject({
    method: "POST",
    url: "/auth/verify",
    payload: { email, code },
  });

  const { accessToken } = JSON.parse(verifyResponse.body) as AuthResponse;
  return accessToken;
}

describe("Short Links API", () => {
  let app: TestApp;
  let accessToken: string;
  const testEmail = "test@example.com";

  beforeEach(async () => {
    app = await buildTestApp();
    accessToken = await loginAndVerify(app, testEmail);
    
    // Debug: verify token works
    const verifyResp = await app.inject({
      method: "POST",
      url: "/auth/verify",
      payload: { email: testEmail, code: app.testAuthNotifier.lastCode },
    });
  });

  describe("POST /short-links", () => {
    it("should create short link", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com" },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as ShortLinkResponse;
      expect(body).toHaveProperty("slug");
      expect(body).toHaveProperty("shortUrl");
      expect(body.originalUrl).toBe("https://example.com");
    });

    it("should reject duplicate slug generation", async () => {
      const response1 = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/1" },
      });

      const response2 = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/2" },
      });

      expect(response1.statusCode).toBe(201);
      expect(response2.statusCode).toBe(201);

      const body1 = JSON.parse(response1.body) as ShortLinkResponse;
      const body2 = JSON.parse(response2.body) as ShortLinkResponse;
      expect(body1.slug).not.toBe(body2.slug);
    });

    it("should allow multiple short links for same URL", async () => {
      const response1 = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com" },
      });

      const response2 = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com" },
      });

      expect(response1.statusCode).toBe(201);
      expect(response2.statusCode).toBe(201);
    });

    it("should reject invalid URL", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "not-a-url" },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should reject unauthenticated request", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/short-links",
        payload: { url: "https://example.com" },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /short-links", () => {
    it("should list short links", async () => {
      await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/1" },
      });

      await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/2" },
      });

      const response = await app.inject({
        method: "GET",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ListResponse;
      expect(body.items).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it("should return empty list when no links", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ListResponse;
      expect(body.items).toHaveLength(0);
      expect(body.total).toBe(0);
    });

    it("should paginate results", async () => {
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: "POST",
          url: "/short-links",
          headers: { authorization: `Bearer ${accessToken}` },
          payload: { url: `https://example.com/${i}` },
        });
      }

      const response = await app.inject({
        method: "GET",
        url: "/short-links?page=1&limit=3",
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ListResponse;
      expect(body.items.length).toBeLessThanOrEqual(3);
    });

    it("should sort by newest first", async () => {
      const r1 = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/old" },
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const r2 = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/new" },
      });

      const listResponse = await app.inject({
        method: "GET",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
      });

      const body = JSON.parse(listResponse.body) as ListResponse;
      const newSlug = JSON.parse(r2.body).slug;
      expect(body.items[0].slug).toBe(newSlug);
    });

    it("should only show user's own links", async () => {
      await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/user1" },
      });

      const otherToken = await loginAndVerify(app, "other@example.com");
      await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${otherToken}` },
        payload: { url: "https://example.com/user2" },
      });

      const response = await app.inject({
        method: "GET",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
      });

      const body = JSON.parse(response.body) as ListResponse;
      expect(body.total).toBe(1);
      expect(body.items[0].originalUrl).toBe("https://example.com/user1");
    });
  });

  describe("GET /short-links/:slug", () => {
    it("should get short link by slug", async () => {
      const createResponse = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/test" },
      });

      const { slug } = JSON.parse(createResponse.body) as ShortLinkResponse;

      const response = await app.inject({
        method: "GET",
        url: `/short-links/${slug}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.slug).toBe(slug);
      expect(body.originalUrl).toBe("https://example.com/test");
    });

    it("should return 404 for non-existent slug", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/short-links/nonexistent",
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should only allow owner to view link", async () => {
      const createResponse = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/private" },
      });

      const { slug } = JSON.parse(createResponse.body) as ShortLinkResponse;

      const otherToken = await loginAndVerify(app, "other@example.com");
      const response = await app.inject({
        method: "GET",
        url: `/short-links/${slug}`,
        headers: { authorization: `Bearer ${otherToken}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /short-links/:slug", () => {
    it("should delete short link", async () => {
      const createResponse = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/todelete" },
      });

      const { slug } = JSON.parse(createResponse.body) as ShortLinkResponse;

      const deleteResponse = await app.inject({
        method: "DELETE",
        url: `/short-links/${slug}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(deleteResponse.statusCode).toBe(204);

      const getResponse = await app.inject({
        method: "GET",
        url: `/short-links/${slug}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it("should return 404 when deleting non-existent link", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/short-links/nonexistent",
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should only allow owner to delete link", async () => {
      const createResponse = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/private" },
      });

      const { slug } = JSON.parse(createResponse.body) as ShortLinkResponse;

      const otherToken = await loginAndVerify(app, "other@example.com");
      const response = await app.inject({
        method: "DELETE",
        url: `/short-links/${slug}`,
        headers: { authorization: `Bearer ${otherToken}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /:slug (redirect)", () => {
    it("should redirect to original URL", async () => {
      const createResponse = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/redirect" },
      });

      const { slug } = JSON.parse(createResponse.body) as ShortLinkResponse;

      const response = await app.inject({
        method: "GET",
        url: `/${slug}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe("https://example.com/redirect");
    });

    it("should return 404 for non-existent slug", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/nonexistent",
      });

      expect(response.statusCode).toBe(404);
    });

    it("should increment visit count on redirect", async () => {
      const createResponse = await app.inject({
        method: "POST",
        url: "/short-links",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { url: "https://example.com/visits" },
      });

      const { slug } = JSON.parse(createResponse.body) as ShortLinkResponse;

      await app.inject({
        method: "GET",
        url: `/${slug}`,
      });

      const getResponse = await app.inject({
        method: "GET",
        url: `/short-links/${slug}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });

      const body = JSON.parse(getResponse.body);
      expect(body.visits).toBe(1);
    });
  });
});
