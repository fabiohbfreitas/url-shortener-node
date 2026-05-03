import { beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "./test-utils/build-test-app.js";

describe("Auth API", () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await buildTestApp();
  });

  describe("POST /auth/login", () => {
    it("should send auth code for new user", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({ message: "Verification code sent" });
    });

    it("should send auth code for existing user", async () => {
      await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      expect(response.statusCode).toBe(200);
    });

    it("should invalidate previous auth codes on new login", async () => {
      await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      const firstCode = app.testAuthNotifier.lastCode;

      await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      const secondCode = app.testAuthNotifier.lastCode;

      expect(firstCode).not.toBe(secondCode);
    });

    it("should reject invalid email format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "invalid-email" },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /auth/verify", () => {
    it("should verify code and return access token", async () => {
      await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      const code = app.testAuthNotifier.lastCode;

      const response = await app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: { email: "test@example.com", code },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("accessToken");
    });

    it("should reject invalid code", async () => {
      await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      const response = await app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: { email: "test@example.com", code: "000000" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe("Invalid or expired code");
    });

    it("should reject code for wrong email", async () => {
      await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      const code = app.testAuthNotifier.lastCode;

      const response = await app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: { email: "other@example.com", code },
      });

      expect(response.statusCode).toBe(401);
    });

    it("should reject invalid email format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: { email: "invalid", code: "123456" },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should reject invalid code format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: { email: "test@example.com", code: "abc" },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should not reuse auth code after verification", async () => {
      await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "test@example.com" },
      });

      const code = app.testAuthNotifier.lastCode;

      await app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: { email: "test@example.com", code },
      });

      const response = await app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: { email: "test@example.com", code },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
