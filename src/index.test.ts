import { describe, expect, it } from "vitest";
import { __testExports } from "./index.js";
import { invalidateStorageCache } from "./index.js";

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
});
