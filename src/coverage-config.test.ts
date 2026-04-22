import { describe, expect, it } from "vitest";
import config from "../vitest.config";

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
