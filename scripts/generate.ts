// Writes the generated week as a CSV in the original's layout (id, timestamp, lon, lat), plus a summary.
// The page doesn't need this file: it runs the same generator with the same seed.
import { mkdirSync, writeFileSync } from "node:fs";
import { findPois, totalTime } from "../src/analysis/staypoints.ts";
import { generate, SEED } from "../src/data/generate.ts";
import { dayAndClock } from "../src/data/time.ts";

const seed = Number(process.argv[2] ?? SEED);
const data = generate(seed);
const rows = ["id,timestamp,lon,lat"];
for (const person of data.people) {
  for (const f of data.traces[person.id]) rows.push(`${person.id},${dayAndClock(f.t)}:${String(f.t % 60).padStart(2, "0")},${f.lon},${f.lat}`);
}
mkdirSync("generated", { recursive: true });
writeFileSync("generated/traces.csv", rows.join("\n") + "\n");

for (const person of data.people) {
  const fixes = data.traces[person.id];
  const pois = findPois(fixes).sort((a, b) => totalTime(b) - totalTime(a));
  console.log(`${person.name}: ${fixes.length} fixes, ${pois.length} places`);
  for (const poi of pois) {
    console.log(`  ${(totalTime(poi) / 3600).toFixed(1).padStart(6)} h  ${poi.visits.length} visits  ${poi.place?.label ?? "unlabelled spot"}`);
  }
}
console.log(`${rows.length - 1} fixes written to generated/traces.csv (seed ${seed})`);
