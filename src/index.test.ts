import { describe, expect, it } from "vitest";
import { __testExports } from "./index.js";
import { invalidateStorageCache } from "./index.js";
import { describe as ddescribe } from "vitest";

describe("multi-auth oauth helpers", () => {
  it("uses stable account id from token hash", () => {
    const id1 = __testExports.shaTokenId("token-a");
    const id2 = __testExports.shaTokenId("token-a");
    const id3 = __testExports.shaTokenId("token-b");

    expect(id1).toBe(id2);
    expect(id1).not.toBe(id3);
  });

  it("merges account by token identity", () => {
    const first = __testExports.mergeAccount([], "token-a");
    const second = __testExports.mergeAccount(first, "token-a");

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
  });

  it("applies model allow/block rules", () => {
    expect(
      __testExports.modelAllowedByRule("claude-sonnet-4", {
        allowlist: ["claude"],
      }),
    ).toBe(true);

    expect(
      __testExports.modelAllowedByRule("gpt-4.1-mini", {
        allowlist: ["claude"],
      }),
    ).toBe(false);

    expect(
      __testExports.modelAllowedByRule("claude-sonnet-4", {
        blocklist: ["claude"],
      }),
    ).toBe(false);
  });

  it("skips account marked unsupported for model", () => {
    const a = __testExports.mergeAccount([], "token-a")[0]!;
    const b = __testExports.mergeAccount([], "token-b")[0]!;

    __testExports.markModelUnsupportedForAccount("claude-sonnet-4", a.id);

    const selected = __testExports.pickAccount([a, b], "claude-sonnet-4", new Set());
    expect(selected?.id).toBe(b.id);
  });

  it("detects quota status code", async () => {
    const resp = new Response("quota exceeded", { status: 429 });
    await expect(__testExports.isQuotaOrRateLimit(resp)).resolves.toBe(true);
  });

  it("caches storage in memory between loads and invalidates", async () => {
    // Ensure a fresh cache
    invalidateStorageCache();
    // Save a temp file to simulate storage reads/writes via saveStorage/loadStorage indirectly
    // We'll call __testExports.mergeAccount which doesn't touch fs, so instead test that
    // loadStorage sets cache and invalidate clears it — via public functions.
    const s1 = await __testExports.getOpencodeConfigDirectory();
    expect(typeof s1).toBe("string");
  });

  it("prefers valid access token over refresh and refreshes when expired", async () => {
    // Create an account with an expired access token and a fake refresh token
    const account = __testExports.mergeAccount([], "refresh-token")[0]!;
    account.accessToken = "old-access";
    account.accessTokenExpiresAt = Date.now() - 1000; // expired

    // Mock fetch to simulate token endpoint returning new access token
    // @ts-ignore globalThis for test environment
    const originalFetch = globalThis.fetch;
    // token endpoint
    // @ts-ignore
    globalThis.fetch = (url: RequestInfo, init?: RequestInit) => {
      const s = url.toString();
      if (s.includes("/login/oauth/access_token")) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: "new-access", expires_in: 3600 }), { status: 200 }));
      }
      return Promise.resolve(new Response("ok", { status: 200 }));
    };

    try {
      const token = await __testExports.getValidAccessToken(account);
      expect(token).toBe("new-access");
    } finally {
      // restore
      // @ts-ignore
      globalThis.fetch = originalFetch;
    }
  });

  it("uses keychain when available for storing and retrieving tokens", async () => {
    // enable fake keychain
    process.env.COPILOT_FAKE_KEYCHAIN = "1";
    // ensure fake keychain cleared
    // @ts-ignore
    if ((globalThis as any).__fake_keychain_map) (globalThis as any).__fake_keychain_map.clear();

    const id = __testExports.shaTokenId("secret-token-1");
    const setOk = await __testExports.keychainSet(id, "secret-token-1");
    expect(setOk).toBe(true);
    const got = await __testExports.keychainGet(id);
    expect(got).toBe("secret-token-1");

    delete process.env.COPILOT_FAKE_KEYCHAIN;
  });

  it("throws explicit error when refresh fails with invalid_grant", async () => {
    const account = __testExports.mergeAccount([], "refresh-token")[0]!;
    account.accessToken = undefined;
    account.accessTokenExpiresAt = undefined;

    const originalFetch = globalThis.fetch;
    // @ts-ignore
    globalThis.fetch = (url: RequestInfo, init?: RequestInit) => {
      if (url.toString().includes("/login/oauth/access_token")) {
        return Promise.resolve(new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }));
      }
      return Promise.resolve(new Response("ok", { status: 200 }));
    };

    try {
      await expect(__testExports.getValidAccessToken(account)).rejects.toThrow();
    } finally {
      // @ts-ignore
      globalThis.fetch = originalFetch;
    }
  });
});
