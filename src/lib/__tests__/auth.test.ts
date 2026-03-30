// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// Mock server-only so it doesn't throw in jsdom
vi.mock("server-only", () => ({}));

// Mock next/headers cookies
const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ set: mockSet, get: mockGet, delete: mockDelete })
  ),
}));

// Import after mocks are set up
const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("sets an httpOnly cookie named auth-token", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockSet).toHaveBeenCalledOnce();
    const [cookieName, , options] = mockSet.mock.calls[0];
    expect(cookieName).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
  });

  test("cookie has correct sameSite and path settings", async () => {
    await createSession("user-123", "test@example.com");

    const [, , options] = mockSet.mock.calls[0];
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("cookie is not secure outside production", async () => {
    // NODE_ENV is "test" by default in vitest, which is not "production"
    await createSession("user-123", "test@example.com");

    const [, , options] = mockSet.mock.calls[0];
    expect(options.secure).toBe(false);
  });

  test("cookie expires approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-123", "test@example.com");
    const after = Date.now();

    const [, , options] = mockSet.mock.calls[0];
    const expiresMs = options.expires.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("token is a valid JWT signed with HS256", async () => {
    await createSession("user-456", "alice@example.com");

    const [, token] = mockSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.alg).toBeUndefined(); // alg lives in header, not payload
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  test("JWT payload contains userId and email", async () => {
    await createSession("user-789", "bob@example.com");

    const [, token] = mockSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-789");
    expect(payload.email).toBe("bob@example.com");
  });

  test("JWT expires in ~7 days", async () => {
    const before = Math.floor(Date.now() / 1000);
    await createSession("user-123", "test@example.com");
    const after = Math.floor(Date.now() / 1000);

    const [, token] = mockSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const sevenDays = 7 * 24 * 60 * 60;
    expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDays - 5);
    expect(payload.exp).toBeLessThanOrEqual(after + sevenDays + 5);
  });

  test("each call generates a unique token", async () => {
    await createSession("user-1", "a@example.com");
    await createSession("user-2", "b@example.com");

    const token1 = mockSet.mock.calls[0][1];
    const token2 = mockSet.mock.calls[1][1];
    expect(token1).not.toBe(token2);
  });
});
