import { describe, expect, it } from "vitest";
import { generate, PEOPLE, SEED } from "../src/data/generate.ts";
import { distance } from "../src/data/geo.ts";
import { PLACES } from "../src/data/places.ts";
import { WEEK_SECONDS } from "../src/data/time.ts";

describe("generator", () => {
  it("makes the same week every time with the same seed", () => {
    expect(generate(SEED)).toEqual(generate(SEED));
  });

  it("makes a different week with another seed", () => {
    expect(generate(SEED + 1).traces.ines).not.toEqual(generate(SEED).traces.ines);
  });

  it("gives every person a week of time-ordered fixes", () => {
    const data = generate();
    expect(data.people).toHaveLength(6);
    for (const person of PEOPLE) {
      const fixes = data.traces[person.id];
      expect(fixes.length).toBeGreaterThan(1500);
      for (let i = 1; i < fixes.length; i++) expect(fixes[i].t).toBeGreaterThan(fixes[i - 1].t);
      expect(fixes[0].t).toBeGreaterThanOrEqual(0);
      expect(fixes[fixes.length - 1].t).toBeLessThan(WEEK_SECONDS);
    }
  });

  it("has gaps and outliers, like a real log", () => {
    const fixes = generate().traces.hugo;
    const longestGap = Math.max(...fixes.slice(1).map((f, i) => f.t - fixes[i].t));
    expect(longestGap).toBeGreaterThan(20 * 60);
    const jumps = fixes.slice(1).filter((f, i) => distance(fixes[i], f) > 700 && f.t - fixes[i].t < 400);
    expect(jumps.length).toBeGreaterThan(0);
  });

  it("never gives a home a street address", () => {
    for (const home of PLACES.filter((p) => p.kind === "home")) {
      expect(home.label).toBe("home (approximate)");
    }
  });
});
