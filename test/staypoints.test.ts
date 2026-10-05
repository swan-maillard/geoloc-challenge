import { describe, expect, it } from "vitest";
import { detectStays, findPois, hourlyMinutes, mergeStays } from "../src/analysis/staypoints.ts";
import type { Fix } from "../src/data/generate.ts";
import { offset, type LatLon } from "../src/data/geo.ts";
import { placeById } from "../src/data/places.ts";
import { at } from "../src/data/time.ts";

const insa = placeById("insa");
const theatre = placeById("theatre");

// One fix a minute at `where`, a few metres apart, from start for `minutes`.
function still(where: LatLon, start: number, minutes: number): Fix[] {
  return Array.from({ length: minutes }, (_, i) => ({ ...offset(where, (i % 3) * 8, (i % 2) * 8), t: start + i * 60 }));
}

// Cycling north, 300 m a minute.
function ride(from: LatLon, start: number, minutes: number): Fix[] {
  return Array.from({ length: minutes }, (_, i) => ({ ...offset(from, (i + 1) * 300, 0), t: start + i * 60 }));
}

describe("stay-point detection", () => {
  it("finds a stay that lasts long enough and ignores a short stop", () => {
    const fixes = [
      ...still(insa, at(0, 9), 45),
      ...ride(insa, at(0, 9, 45), 10),
      ...still(theatre, at(0, 10, 0), 10),
    ];
    const stays = detectStays(fixes, 200, 20 * 60);
    expect(stays).toHaveLength(1);
    expect(stays[0].start).toBe(at(0, 9));
    expect(stays[0].end).toBe(at(0, 9, 44));
  });

  it("finds the short stop once the minimum time goes down", () => {
    const fixes = [...still(insa, at(0, 9), 45), ...ride(insa, at(0, 9, 45), 10), ...still(theatre, at(0, 10, 0), 10)];
    expect(detectStays(fixes, 200, 5 * 60)).toHaveLength(2);
  });

  it("splits a stay on an outlier, then merging puts it back together", () => {
    const outlier: Fix = { ...offset(insa, 1500, 0), t: at(0, 9, 30) };
    const fixes = [...still(insa, at(0, 9), 30), outlier, ...still(insa, at(0, 9, 31), 30)];
    const stays = detectStays(fixes, 200, 20 * 60);
    expect(stays).toHaveLength(2);
    const merged = mergeStays(stays, 200);
    expect(merged).toHaveLength(1);
    expect(merged[0].start).toBe(at(0, 9));
    expect(merged[0].end).toBe(at(0, 10, 0));
  });

  it("keeps stays apart when the radius is smaller than the walk between them", () => {
    const fixes = [...still(insa, at(0, 9), 30), ...still(offset(insa, 400, 0), at(0, 9, 30), 30)];
    expect(mergeStays(detectStays(fixes, 200, 20 * 60), 200)).toHaveLength(2);
    expect(mergeStays(detectStays(fixes, 500, 20 * 60), 500)).toHaveLength(1);
  });

  it("groups visits on different days into one labelled place", () => {
    const fixes = [
      ...still(insa, at(0, 9), 60),
      ...still(theatre, at(0, 20), 60),
      ...still(insa, at(1, 9), 60),
    ];
    const pois = findPois(fixes);
    expect(pois).toHaveLength(2);
    expect(pois[0].place?.id).toBe("insa");
    expect(pois[0].visits).toHaveLength(2);
    expect(pois[1].place?.id).toBe("theatre");
  });

  it("counts time by hour of day", () => {
    const pois = findPois(still(insa, at(2, 9, 30), 61));
    const minutes = hourlyMinutes(pois[0]);
    expect(minutes[9]).toBe(30);
    expect(minutes[10]).toBe(30);
    expect(minutes.reduce((a, b) => a + b)).toBe(60);
  });
});
