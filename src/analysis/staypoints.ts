import { distance, type LatLon } from "../data/geo.ts";
import type { Fix } from "../data/generate.ts";
import { PLACES, type Place } from "../data/places.ts";

export const DEFAULT_RADIUS = 200;
export const DEFAULT_MIN_MINUTES = 20;
// Two stays at the same spot with less than this between them are one visit (an outlier or a short gap split it).
export const MERGE_GAP = 30 * 60;
export const LABEL_RADIUS = 250;

export interface Stay extends LatLon {
  start: number;
  end: number;
  fixes: number;
}

export interface Poi extends LatLon {
  id: number;
  visits: Stay[];
  place: Place | null;
}

function centroid(fixes: Fix[]): LatLon {
  let lat = 0;
  let lon = 0;
  for (const f of fixes) {
    lat += f.lat;
    lon += f.lon;
  }
  return { lat: lat / fixes.length, lon: lon / fixes.length };
}

// Stay points as in Li et al. (2008): from each fix, extend while the next fixes stay within
// `radius` metres of it. If that run lasts at least `minDuration` seconds, it's a stay.
export function detectStays(fixes: Fix[], radius: number, minDuration: number): Stay[] {
  const stays: Stay[] = [];
  let i = 0;
  while (i < fixes.length) {
    let j = i + 1;
    while (j < fixes.length && distance(fixes[i], fixes[j]) <= radius) j++;
    const last = fixes[j - 1];
    if (last.t - fixes[i].t >= minDuration) {
      const run = fixes.slice(i, j);
      stays.push({ ...centroid(run), start: fixes[i].t, end: last.t, fixes: run.length });
      i = j;
    } else {
      i++;
    }
  }
  return stays;
}

function weightedMerge(a: LatLon & { w: number }, b: LatLon & { w: number }): LatLon {
  const w = a.w + b.w;
  return { lat: (a.lat * a.w + b.lat * b.w) / w, lon: (a.lon * a.w + b.lon * b.w) / w };
}

export function mergeStays(stays: Stay[], radius: number): Stay[] {
  const merged: Stay[] = [];
  for (const stay of stays) {
    const prev = merged[merged.length - 1];
    if (prev && stay.start - prev.end <= MERGE_GAP && distance(prev, stay) <= radius) {
      const centre = weightedMerge({ ...prev, w: prev.fixes }, { ...stay, w: stay.fixes });
      merged[merged.length - 1] = { ...centre, start: prev.start, end: stay.end, fixes: prev.fixes + stay.fixes };
    } else {
      merged.push(stay);
    }
  }
  return merged;
}

const duration = (s: Stay) => s.end - s.start;

// Visits to the same spot on different days become one place, weighted by time spent.
export function groupIntoPois(visits: Stay[], radius: number): Poi[] {
  const pois: Poi[] = [];
  for (const visit of visits) {
    const poi = pois.find((p) => distance(p, visit) <= radius);
    if (poi) {
      const time = poi.visits.reduce((sum, v) => sum + duration(v), 0);
      Object.assign(poi, weightedMerge({ ...poi, w: time }, { ...visit, w: Math.max(1, duration(visit)) }));
      poi.visits.push(visit);
    } else {
      pois.push({ id: pois.length, lat: visit.lat, lon: visit.lon, visits: [visit], place: null });
    }
  }
  for (const poi of pois) poi.place = nearestPlace(poi);
  return pois;
}

// The original looked places up in OpenStreetMap. Here the only places that exist are the generated ones.
export function nearestPlace(p: LatLon): Place | null {
  let best: Place | null = null;
  let bestDistance = LABEL_RADIUS;
  for (const place of PLACES) {
    const d = distance(p, place);
    if (d <= bestDistance) {
      best = place;
      bestDistance = d;
    }
  }
  return best;
}

export function findPois(fixes: Fix[], radius = DEFAULT_RADIUS, minMinutes = DEFAULT_MIN_MINUTES): Poi[] {
  const stays = detectStays(fixes, radius, minMinutes * 60);
  return groupIntoPois(mergeStays(stays, radius), radius);
}

export function totalTime(poi: Poi): number {
  return poi.visits.reduce((sum, v) => sum + duration(v), 0);
}

// Minutes spent at the place in each hour of the day, added up over the week.
export function hourlyMinutes(poi: Poi): number[] {
  const minutes = new Array<number>(24).fill(0);
  for (const visit of poi.visits) {
    for (let t = visit.start; t < visit.end; ) {
      const hourEnd = (Math.floor(t / 3600) + 1) * 3600;
      const next = Math.min(hourEnd, visit.end);
      minutes[Math.floor(t / 3600) % 24] += (next - t) / 60;
      t = next;
    }
  }
  return minutes;
}

export function visitsAt(pois: Poi[], t: number): Poi | null {
  return pois.find((p) => p.visits.some((v) => v.start <= t && t <= v.end)) ?? null;
}
