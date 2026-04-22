import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

describe("CI Node version alignment", () => {
  const ciPath = path.resolve(__dirname, "../.github/workflows/ci.yml");

  it("CI matrix should only test Node 20.x as declared in package.json engines", () => {
    const raw = fs.readFileSync(ciPath, "utf8");

    // Expect the matrix to contain only 20.x (no 18.x entries)
    expect(raw).toContain("node-version: [20.x]");
    expect(raw).not.toMatch(/18\.x/);
  });

  it("lint job should use Node 20.x", () => {
    const raw = fs.readFileSync(ciPath, "utf8");
    expect(raw).toContain("node-version: '20.x'");
  });
});
