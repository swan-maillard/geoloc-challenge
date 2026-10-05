import { distance } from "../data/geo.ts";
import type { Fix } from "../data/generate.ts";

// A fix is a spike when it's far from both neighbours while they are close to each other.
export function removeSpikes(fixes: Fix[], jump = 500): Fix[] {
  return fixes.filter((f, i) => {
    const prev = fixes[i - 1];
    const next = fixes[i + 1];
    if (!prev || !next) return true;
    return !(distance(prev, f) > jump && distance(f, next) > jump && distance(prev, next) < jump);
  });
}

export function speedKmh(a: Fix, b: Fix): number {
  const seconds = b.t - a.t;
  return seconds > 0 ? (distance(a, b) / seconds) * 3.6 : 0;
}

// Index of the last fix at or before t, or -1.
export function lastIndexAt(fixes: Fix[], t: number): number {
  let lo = 0;
  let hi = fixes.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fixes[mid].t <= t) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

export function between(fixes: Fix[], start: number, end: number): Fix[] {
  return fixes.filter((f) => f.t >= start && f.t <= end);
}

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function speeds(fixes: Fix[]): number[] {
  return fixes.slice(1).map((f, i) => speedKmh(fixes[i], f));
}
