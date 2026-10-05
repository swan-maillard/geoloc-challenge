import { distance, lerp, offset, type LatLon } from "./geo.ts";
import { placeById } from "./places.ts";
import { createRng, gaussian, hashString, uniform, type Rng } from "./random.ts";
import { ROUTES, type Mode, type RouteId } from "./routes.ts";
import { at, WEEK_SECONDS } from "./time.ts";

export const SEED = 2015;

export interface Fix extends LatLon {
  t: number;
}

export interface Person {
  id: string;
  name: string;
}

export interface Dataset {
  seed: number;
  people: Person[];
  traces: Record<string, Fix[]>;
}

export const PEOPLE: Person[] = [
  { id: "ines", name: "Inès" },
  { id: "tom", name: "Tom" },
  { id: "lea", name: "Léa" },
  { id: "hugo", name: "Hugo" },
  { id: "camille", name: "Camille" },
  { id: "malik", name: "Malik" },
];

type Step =
  | { type: "stay"; place: string; until: number; routine: boolean }
  | { type: "move"; route: RouteId; reverse: boolean; speeds?: number[] };

const MIN_STAY = 5 * 60;

class Planner {
  readonly steps: Step[] = [];
  private readonly rng: Rng;

  constructor(rng: Rng) {
    this.rng = rng;
  }

  // A time near day hh:mm, give or take spread minutes.
  around(day: number, hours: number, minutes: number, spread: number): number {
    return Math.round(at(day, hours, minutes) + uniform(this.rng, -spread, spread) * 60);
  }

  stay(place: string, until: number, routine = false): this {
    this.steps.push({ type: "stay", place, until, routine });
    return this;
  }

  go(route: RouteId, reverse = false, speeds?: number[]): this {
    this.steps.push({ type: "move", route, reverse, speeds });
    return this;
  }
}

const WEEKDAYS = [0, 1, 2, 3, 4];

const PLANS: Record<string, (plan: Planner) => void> = {
  ines(plan) {
    for (const d of WEEKDAYS) {
      plan.stay("home-ines", plan.around(d, 8, 10, 15), true).go("inesBike");
      plan.stay("insa", plan.around(d, 17, 45, 30), true).go("inesBike", true);
    }
    plan.stay("home-ines", plan.around(5, 14, 30, 20), true).go("inesToPark");
    plan.stay("tete-d-or", plan.around(5, 16, 30, 20)).go("inesToPark", true);
  },
  tom(plan) {
    for (const d of WEEKDAYS) {
      plan.stay("home-villeurbanne", plan.around(d, 8, 20, 15), true).go("tomWalk");
      plan.stay("insa", plan.around(d, 18, 0, 40), true).go("tomWalk", true);
    }
    plan.stay("home-villeurbanne", plan.around(5, 11, 0, 20), true).go("toSupermarket");
    plan.stay("supermarket", plan.around(5, 12, 0, 5)).go("toSupermarket", true);
    plan.stay("home-villeurbanne", at(6, 19, 0), true).go("tomTramToStadium");
    plan.stay("stadium", at(6, 23, 0)).go("tomTramToStadium", true);
  },
  lea(plan) {
    const workday = (d: number) => {
      plan.stay("home-lea", plan.around(d, 9, 20, 10), true).go("leaWalk");
      plan.stay("republique-shop", plan.around(d, 18, 50, 20), true).go("leaWalk", true);
    };
    [0, 1, 2].forEach(workday);
    plan.stay("home-lea", at(3, 6, 10), true).go("leaToPartDieu");
    plan.stay("part-dieu", at(3, 7, 4)).go("tgvToParis");
    plan.stay("paris-gare-de-lyon", at(3, 9, 20)).go("parisWalk");
    plan.stay("paris-office", at(3, 17, 15)).go("parisWalk", true);
    plan.stay("paris-gare-de-lyon", at(3, 18, 4)).go("tgvToParis", true);
    plan.stay("part-dieu", 0).go("leaToPartDieu", true);
    workday(4);
    plan.stay("home-lea", at(5, 14, 15), true).go("leaToSaintJean");
    plan.stay("saint-jean", at(5, 16, 0)).go("leaToSaintJean", true);
    plan.stay("home-lea", at(6, 15, 0), true).go("leaToBellecour");
    plan.stay("bellecour", at(6, 16, 45)).go("leaToBellecour", true);
  },
  hugo(plan) {
    for (const d of WEEKDAYS) {
      plan.stay("home-villeurbanne", plan.around(d, 8, 30, 15), true).go("hugoMetro");
      if (d === 2) {
        plan.stay("part-dieu-office", at(d, 18, 30), true).go("hugoMetroToGym");
        plan.stay("climbing-gym", at(d, 21, 0)).go("hugoMetroHomeToGym", true);
      } else {
        plan.stay("part-dieu-office", plan.around(d, 18, 15, 20), true).go("hugoMetro", true);
      }
    }
    plan.stay("home-villeurbanne", plan.around(5, 16, 0, 20), true).go("toSupermarket");
    plan.stay("supermarket", plan.around(5, 16, 50, 5)).go("toSupermarket", true);
    plan.stay("home-villeurbanne", at(6, 9, 30), true).go("hugoMetroHomeToGym");
    plan.stay("climbing-gym", at(6, 12, 30)).go("hugoMetroHomeToGym", true);
  },
  camille(plan) {
    for (const d of WEEKDAYS) {
      plan.stay("home-camille", plan.around(d, 8, 40, 15), true).go("camilleWalk");
      if (d === 2) {
        plan.stay("hotel-de-ville-office", at(d, 12, 15), true).go("camilleLunch");
        plan.stay("saint-jean", at(d, 13, 20)).go("camilleLunch", true);
      }
      plan.stay("hotel-de-ville-office", plan.around(d, 17, 30, 30), true).go("camilleWalk", true);
    }
    plan.stay("home-camille", at(4, 19, 40), true).go("camilleToTheatre");
    plan.stay("theatre", at(4, 22, 40)).go("camilleToTheatre", true);
    plan.stay("home-camille", at(5, 10, 0), true).go("camilleToSquare");
    plan.stay("croix-rousse-square", at(5, 11, 30)).go("camilleToSquare", true);
  },
  malik(plan) {
    for (const d of WEEKDAYS) {
      if (d === 1) {
        // The Tuesday he leaves late and drives past the camera at 94 km/h.
        plan.stay("home-malik", at(d, 8, 2), true).go("malikCar", false, [35, 55, 94, 94, 70, 50, 35]);
      } else {
        plan.stay("home-malik", plan.around(d, 7, 45, 10), true).go("malikCar");
      }
      plan.stay("insa", plan.around(d, 17, 0, 30), true).go("malikCar", true);
    }
    plan.stay("home-malik", at(6, 19, 15), true).go("malikToStadium");
    plan.stay("stadium", at(6, 23, 5)).go("malikToStadium", true);
  },
};

const STILL_NOISE = 12;
const MOVING_NOISE = 6;

function jitter(rng: Rng, p: LatLon, sigma: number): LatLon {
  return offset(p, gaussian(rng) * sigma, gaussian(rng) * sigma);
}

function toFix(p: LatLon, t: number): Fix {
  return { t: Math.round(t), lat: Math.round(p.lat * 1e6) / 1e6, lon: Math.round(p.lon * 1e6) / 1e6 };
}

function sampleStay(rng: Rng, place: LatLon, start: number, end: number, routine: boolean): Fix[] {
  // Where in the building this visit happens, then GPS noise on top.
  const spot = jitter(rng, place, 15);
  // Phones that sit still for hours often stop logging for a while (battery saver, app killed).
  let gap: [number, number] | null = null;
  if (routine && end - start > 3 * 3600 && rng() < 0.45) {
    const length = uniform(rng, 25, 120) * 60;
    const gapStart = uniform(rng, start + 1800, end - 1800 - length);
    gap = [gapStart, gapStart + length];
  }
  const fixes: Fix[] = [];
  for (let t = start + uniform(rng, 0, 120); t < end; t += uniform(rng, 150, 360)) {
    if (gap && t >= gap[0] && t < gap[1]) continue;
    fixes.push(toFix(jitter(rng, spot, STILL_NOISE), t));
  }
  return fixes;
}

function pathOf(route: RouteId, reverse: boolean): LatLon[] {
  const r = ROUTES[route];
  const points = [placeById(r.from), ...r.via, placeById(r.to)];
  return reverse ? points.reverse() : points;
}

function legSpeeds(route: RouteId, reverse: boolean, legs: number, override?: number[]): number[] {
  const speeds = override ?? ROUTES[route].speeds;
  const all = Array.from({ length: legs }, (_, i) => speeds[Math.min(i, speeds.length - 1)]);
  return reverse ? all.reverse() : all;
}

const SAMPLE_INTERVAL: Record<Mode, [number, number]> = {
  walk: [25, 50],
  bike: [20, 40],
  car: [20, 40],
  tram: [20, 40],
  metro: [0, 0],
  train: [30, 60],
};

function sampleMove(rng: Rng, route: RouteId, reverse: boolean, start: number, override?: number[]) {
  const mode = ROUTES[route].mode;
  const path = pathOf(route, reverse);
  // Scripted trips keep their exact speeds, everyday ones vary a little.
  const factor = override ? 1 : uniform(rng, 0.9, 1.1);
  const speeds = legSpeeds(route, reverse, path.length - 1, override).map((s) => (s * factor) / 3.6);
  const legTimes = speeds.map((speed, i) => distance(path[i], path[i + 1]) / speed);
  const duration = legTimes.reduce((a, b) => a + b, 0);
  const end = start + duration;
  const fixes: Fix[] = [];
  // No GPS underground.
  if (mode === "metro") return { fixes, end };

  // The signal drops for a while on the high-speed line.
  const tunnel = mode === "train" ? [start + duration * 0.45, start + duration * 0.45 + 12 * 60] : null;
  const [minStep, maxStep] = SAMPLE_INTERVAL[mode];
  for (let t = start + uniform(rng, 5, minStep); t < end; t += uniform(rng, minStep, maxStep)) {
    if (tunnel && t >= tunnel[0] && t < tunnel[1]) continue;
    let elapsed = t - start;
    let leg = 0;
    while (leg < legTimes.length - 1 && elapsed > legTimes[leg]) {
      elapsed -= legTimes[leg];
      leg++;
    }
    const position = lerp(path[leg], path[leg + 1], Math.min(1, elapsed / legTimes[leg]));
    fixes.push(toFix(jitter(rng, position, MOVING_NOISE), t));
  }
  return { fixes, end };
}

// A few fixes land far from where the phone really is, as in any real GPS log.
function addOutliers(rng: Rng, fixes: Fix[]): void {
  for (let i = 1; i < fixes.length - 1; i++) {
    if (rng() < 0.004) {
      const angle = uniform(rng, 0, 2 * Math.PI);
      const metres = uniform(rng, 800, 2500);
      fixes[i] = toFix(offset(fixes[i], Math.sin(angle) * metres, Math.cos(angle) * metres), fixes[i].t);
      i++;
    }
  }
}

function lastPlace(steps: Step[]): string {
  const last = steps[steps.length - 1];
  if (last.type === "stay") return last.place;
  const route = ROUTES[last.route];
  return last.reverse ? route.from : route.to;
}

export function generatePerson(seed: number, person: Person): Fix[] {
  const rng = createRng(seed ^ hashString(person.id));
  const plan = new Planner(rng);
  PLANS[person.id](plan);
  plan.stay(lastPlace(plan.steps), WEEK_SECONDS, true);

  const fixes: Fix[] = [];
  let t = 0;
  for (const step of plan.steps) {
    if (step.type === "stay") {
      const end = Math.min(Math.max(step.until, t + MIN_STAY), WEEK_SECONDS);
      fixes.push(...sampleStay(rng, placeById(step.place), t, end, step.routine));
      t = end;
    } else {
      const move = sampleMove(rng, step.route, step.reverse, t, step.speeds);
      fixes.push(...move.fixes);
      t = move.end;
    }
  }
  addOutliers(rng, fixes);
  return fixes.filter((f) => f.t < WEEK_SECONDS);
}

export function generate(seed = SEED): Dataset {
  const traces: Record<string, Fix[]> = {};
  for (const person of PEOPLE) traces[person.id] = generatePerson(seed, person);
  return { seed, people: PEOPLE, traces };
}
