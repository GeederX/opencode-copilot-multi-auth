import { describe, expect, it } from "vitest";
// vitest.config.ts is ESM and outside the src root. Import its runtime shape only when running tests.
// Use dynamic require to avoid TypeScript resolving it during build.
const config: any = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../vitest.config");
  } catch {
    return undefined;
  }
})();

describe("coverage configuration", () => {
  it("defines conservative global coverage thresholds", () => {
    const coverage = (config as any).test?.coverage;
    expect(coverage).toBeDefined();
    expect(coverage.provider).toBe("v8");
    const threshold = coverage.threshold?.global;
    expect(threshold).toBeDefined();
    expect(threshold.statements).toBeGreaterThanOrEqual(45);
    expect(threshold.lines).toBeGreaterThanOrEqual(45);
    expect(threshold.functions).toBeGreaterThanOrEqual(70);
    expect(threshold.branches).toBeGreaterThanOrEqual(50);
  });
});
