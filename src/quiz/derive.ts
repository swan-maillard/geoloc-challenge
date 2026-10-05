// Each answer worked out from the traces alone, the way a player would: find the stays, read the
// places, compare speeds and times. The tests check these against the answers in questions.ts.
import { findPois, type Poi, type Stay } from "../analysis/staypoints.ts";
import { between, median, removeSpikes, speeds } from "../analysis/track.ts";
import type { Dataset, Fix } from "../data/generate.ts";
import { distance, distanceToSegment } from "../data/geo.ts";
import { placeById, SPEED_CAMERA, TETE_D_OR_PARK } from "../data/places.ts";
import { at, DAY_SECONDS } from "../data/time.ts";

function overlap(visit: Stay, start: number, end: number): number {
  return Math.max(0, Math.min(visit.end, end) - Math.max(visit.start, start));
}

function timeIn(poi: Poi, days: number[], fromHour: number, toHour: number): number {
  let total = 0;
  for (const visit of poi.visits) {
    for (const d of days) total += overlap(visit, at(d, fromHour), at(d, toHour));
  }
  return total;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [0, 1, 2, 3, 4];

function mostTime(pois: Poi[], score: (poi: Poi) => number): Poi {
  return pois.reduce((best, poi) => (score(poi) > score(best) ? poi : best));
}

export function homeOf(pois: Poi[]): Poi {
  return mostTime(pois, (poi) => timeIn(poi, ALL_DAYS, 0, 6));
}

export function workOf(pois: Poi[]): Poi {
  const home = homeOf(pois);
  return mostTime(
    pois.filter((p) => p !== home),
    (poi) => timeIn(poi, WEEKDAYS, 9, 17),
  );
}

function visitsOn(pois: Poi[], day: number): { poi: Poi; visit: Stay }[] {
  return pois
    .flatMap((poi) => poi.visits.map((visit) => ({ poi, visit })))
    .filter(({ visit }) => overlap(visit, day * DAY_SECONDS, (day + 1) * DAY_SECONDS) > 0)
    .sort((a, b) => a.visit.start - b.visit.start);
}

const SPORTS: Record<string, string> = { "climbing gym": "climbing" };

function deriveHome(data: Dataset): string {
  const home = homeOf(findPois(data.traces.camille));
  return home.place?.area ?? "unknown";
}

function deriveSport(data: Dataset): string {
  const pois = findPois(data.traces.hugo);
  const regular = pois.filter((poi) => poi.place && SPORTS[poi.place.kind] && poi.visits.length >= 2);
  return regular.length === 1 ? SPORTS[regular[0].place!.kind] : "unknown";
}

function deriveFridayEvening(data: Dataset): string {
  const pois = findPois(data.traces.camille);
  const home = homeOf(pois);
  const outings = visitsOn(pois, 4).filter(({ poi, visit }) => poi !== home && visit.start >= at(4, 19));
  return outings.length === 1 ? (outings[0].poi.place?.kind ?? "unknown") : "unknown";
}

function deriveSameBuilding(data: Dataset): string {
  const homes = data.people.map((p) => ({ id: p.id, home: homeOf(findPois(data.traces[p.id])) }));
  const pairs: string[] = [];
  for (let i = 0; i < homes.length; i++) {
    for (let j = i + 1; j < homes.length; j++) {
      if (distance(homes[i].home, homes[j].home) < 60) pairs.push([homes[i].id, homes[j].id].sort().join("+"));
    }
  }
  return pairs.length === 1 ? pairs[0] : "unknown";
}

function inPark(f: Fix): boolean {
  const box = TETE_D_OR_PARK;
  return f.lat > box.south && f.lat < box.north && f.lon > box.west && f.lon < box.east;
}

// Weekday mornings, between leaving home and reaching work.
export function commuteFixes(data: Dataset, personId: string): Fix[] {
  const fixes = removeSpikes(data.traces[personId]);
  const pois = findPois(data.traces[personId]);
  const home = homeOf(pois);
  const work = workOf(pois);
  const commute: Fix[] = [];
  for (const d of WEEKDAYS) {
    const day = visitsOn(pois, d);
    for (let i = 1; i < day.length; i++) {
      if (day[i - 1].poi === home && day[i].poi === work) {
        commute.push(...between(fixes, day[i - 1].visit.end + 1, day[i].visit.start - 1));
      }
    }
  }
  return commute;
}

export function commuteSpeed(data: Dataset, personId: string): number {
  const fixes = commuteFixes(data, personId);
  const byTrip = fixes.filter((f, i) => i === 0 || f.t - fixes[i - 1].t < 120);
  return median(speeds(byTrip).filter((s) => s > 1));
}

function deriveCyclist(data: Dataset): string {
  const cyclists = data.people.filter((p) => {
    const speed = commuteSpeed(data, p.id);
    return speed >= 10 && speed <= 25 && commuteFixes(data, p.id).some(inPark);
  });
  return cyclists.length === 1 ? cyclists[0].id : "unknown";
}

function deriveTrip(data: Dataset): string {
  const pois = findPois(data.traces.lea);
  const thursday = visitsOn(pois, 3);
  const arrival = thursday.findIndex(({ poi }) => poi.place && distance(poi, placeById("paris-gare-de-lyon")) < 2000);
  if (arrival < 1) return "unknown";
  const departure = thursday[arrival - 1];
  const trip = removeSpikes(between(data.traces.lea, departure.visit.end, thursday[arrival].visit.start));
  const sorted = speeds(trip).sort((a, b) => a - b);
  const fast = sorted[Math.floor(sorted.length * 0.75)];
  const kind = departure.poi.place?.kind;
  if (fast > 200 && kind === "station") return "train";
  if (fast > 200) return "plane";
  return "car";
}

function deriveWhoWasThere(data: Dataset): string {
  const saintJean = placeById("saint-jean");
  const there = data.people.filter((p) =>
    removeSpikes(data.traces[p.id]).some(
      (f) => f.t >= at(5, 14, 55) && f.t <= at(5, 15, 25) && distance(f, saintJean) < 150,
    ),
  );
  return there.length === 1 ? there[0].id : "unknown";
}

function deriveSpeeding(data: Dataset): string {
  const flashed = data.people.filter((p) => {
    const fixes = removeSpikes(between(data.traces[p.id], at(1, 7, 55), at(1, 8, 15)));
    return fixes.slice(1).some((f, i) => {
      const prev = fixes[i];
      const near = distanceToSegment(SPEED_CAMERA, prev, f) < 150;
      return near && f.t - prev.t < 90 && speeds([prev, f])[0] > 90;
    });
  });
  return flashed.length === 1 ? flashed[0].id : "unknown";
}

export const DERIVATIONS: Record<string, (data: Dataset) => string> = {
  "camille-home": deriveHome,
  "hugo-sport": deriveSport,
  "camille-friday": deriveFridayEvening,
  "same-building": deriveSameBuilding,
  "bike-commute": deriveCyclist,
  "lea-paris": deriveTrip,
  "saint-jean-photo": deriveWhoWasThere,
  "speed-camera": deriveSpeeding,
};
