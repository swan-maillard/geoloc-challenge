import "@fontsource/josefin-sans/latin-500";
import "@fontsource/barlow/latin-400";
import "@fontsource/barlow/latin-500";
import "@fontsource/barlow-condensed/latin-500";
import "leaflet/dist/leaflet.css";
import "./style.css";

import {
  DEFAULT_MIN_MINUTES,
  DEFAULT_RADIUS,
  detectStays,
  groupIntoPois,
  mergeStays,
  visitsAt,
  type Poi,
} from "./analysis/staypoints.ts";
import { lastIndexAt, removeSpikes, speedKmh } from "./analysis/track.ts";
import { generate, type Fix } from "./data/generate.ts";
import { clock, DAY_SECONDS, dayAndClock, dayOf, DAYS } from "./data/time.ts";
import { QUESTIONS } from "./quiz/questions.ts";
import { TraceMap, type PersonView } from "./ui/map.ts";
import { capitalise, placeName, renderPoiDetails, renderPoiList } from "./ui/panel.ts";
import { Quiz } from "./ui/quiz.ts";

const data = generate();
const cleaned: Record<string, Fix[]> = {};
for (const p of data.people) cleaned[p.id] = removeSpikes(data.traces[p.id]);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// A fix older than this means the phone has gone quiet.
const STALE_AFTER = 10 * 60;
const PLAY_SPEED = 30 / 1000; // minutes of the day per millisecond: one day in 48 seconds.

const state = {
  shown: new Set(data.people.map((p) => p.id)),
  focus: "ines",
  day: 0,
  minute: 8 * 60 + 30,
  radius: DEFAULT_RADIUS,
  minMinutes: DEFAULT_MIN_MINUTES,
  selectedPoi: null as number | null,
  playing: false,
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const daySelect = $<HTMLSelectElement>("day");
const timeInput = $<HTMLInputElement>("time");
const timeOut = $<HTMLOutputElement>("time-out");
const playButton = $<HTMLButtonElement>("play");
const focusSelect = $<HTMLSelectElement>("focus-person");
const radiusInput = $<HTMLInputElement>("radius");
const minutesInput = $<HTMLInputElement>("minutes");

const map = new TraceMap($("map"), reducedMotion, (id) => selectPoi(id));

const poiCache = new Map<string, { stays: number; visits: number; pois: Poi[] }>();
function analyse(personId: string) {
  const key = `${personId}:${state.radius}:${state.minMinutes}`;
  let result = poiCache.get(key);
  if (!result) {
    const stays = detectStays(data.traces[personId], state.radius, state.minMinutes * 60);
    const visits = mergeStays(stays, state.radius);
    result = { stays: stays.length, visits: visits.length, pois: groupIntoPois(visits, state.radius) };
    poiCache.set(key, result);
  }
  return result;
}

const nameOf = (id: string) => data.people.find((p) => p.id === id)!.name;
const now = () => state.day * DAY_SECONDS + state.minute * 60;

function dayFixes(fixes: Fix[]): Fix[] {
  const start = state.day * DAY_SECONDS;
  return fixes.filter((f) => f.t >= start && f.t < start + DAY_SECONDS);
}

function status(personId: string): string {
  const t = now();
  const name = nameOf(personId);
  const visit = visitsAt(analyse(personId).pois, t);
  if (visit) {
    const current = visit.visits.find((v) => v.start <= t && t <= v.end)!;
    const since = dayOf(current.start) === state.day ? clock(current.start) : dayAndClock(current.start);
    return `${name} is at ${placeName(visit)}, since ${since}.`;
  }
  const fixes = cleaned[personId];
  const i = lastIndexAt(fixes, t);
  if (i < 0) return `${name} has no fix yet.`;
  if (t - fixes[i].t > STALE_AFTER) return `${name} has had no signal since ${clock(fixes[i].t)}.`;
  if (i > 0 && fixes[i].t - fixes[i - 1].t < 120) {
    return `${name} is on the move at about ${Math.round(speedKmh(fixes[i - 1], fixes[i]))} km/h.`;
  }
  return `${name} is on the move.`;
}

function views(): PersonView[] {
  const t = now();
  return data.people
    .filter((p) => state.shown.has(p.id))
    .map((p) => {
      const trace = dayFixes(data.traces[p.id]).filter((f) => f.t <= t);
      const fixes = cleaned[p.id];
      const i = lastIndexAt(fixes, t);
      const position = i >= 0 ? fixes[i] : null;
      return {
        id: p.id,
        name: p.name,
        trace,
        position,
        stale: position ? t - position.t > STALE_AFTER : true,
        focus: p.id === state.focus,
      };
    });
}

function renderLive(): void {
  const live = $("live");
  const ids = [state.focus, ...[...state.shown].filter((id) => id !== state.focus)].filter((id) => state.shown.has(id));
  const when = `${DAYS[state.day]}, ${clock(now())}`;
  live.replaceChildren();
  const heading = document.createElement("p");
  heading.className = "when";
  heading.textContent = when;
  live.append(heading);
  if (ids.length === 0) {
    const empty = document.createElement("p");
    empty.className = "faded";
    empty.textContent = "Nobody is on the map. Tick a name under People.";
    live.append(empty);
  } else {
    const list = document.createElement("ul");
    for (const id of ids) {
      const item = document.createElement("li");
      item.textContent = status(id);
      if (id === state.focus) item.className = "focus";
      list.append(item);
    }
    live.append(list);
  }
  const summary = `${when}. ${ids.map(status).join(" ")}`;
  $("map-summary").textContent = summary;
  if (!state.playing) announce(summary);
}

let announceTimer = 0;
function announce(text: string): void {
  window.clearTimeout(announceTimer);
  announceTimer = window.setTimeout(() => ($("announcer").textContent = text), 600);
}

function renderTime(): void {
  timeInput.value = String(state.minute);
  timeOut.textContent = clock(state.minute * 60);
  timeInput.setAttribute("aria-valuetext", `${DAYS[state.day]} ${clock(state.minute * 60)}`);
  map.draw(views());
  renderLive();
}

function renderPlaces(): void {
  const { stays, visits, pois } = analyse(state.focus);
  $("places-name").textContent = nameOf(state.focus);
  $("detect-summary").textContent =
    `With D = ${state.radius} m and T = ${state.minMinutes} min: ${stays} stays, ${visits} visits, ` +
    `${pois.length} ${pois.length === 1 ? "place" : "places"}. Click one to see when.`;
  renderPoiList($("poi-list"), pois, state.selectedPoi, selectPoi);
  map.showPois(pois, state.selectedPoi);
  const details = $("poi-details");
  const poi = pois.find((p) => p.id === state.selectedPoi);
  details.hidden = !poi;
  if (poi) renderPoiDetails(details, poi);
}

function selectPoi(id: number): void {
  state.selectedPoi = id;
  renderPlaces();
  const poi = analyse(state.focus).pois.find((p) => p.id === id);
  if (poi) {
    map.panTo(poi);
    announce(`${capitalise(placeName(poi))}: ${poi.visits.length} visits. Details are under the list of places.`);
  }
}

function fitDay(): void {
  const points = [...state.shown].flatMap((id) => dayFixes(cleaned[id]));
  map.fit(points);
}

function renderDetectionOutputs(): void {
  radiusInput.value = String(state.radius);
  minutesInput.value = String(state.minMinutes);
  $("radius-out").textContent = `${state.radius} m${state.radius === DEFAULT_RADIUS ? " (default)" : ""}`;
  $("minutes-out").textContent = `${state.minMinutes} min${state.minMinutes === DEFAULT_MIN_MINUTES ? " (default)" : ""}`;
}

function renderFocusOptions(): void {
  const shown = data.people.filter((p) => state.shown.has(p.id));
  if (shown.length > 0 && !state.shown.has(state.focus)) state.focus = shown[0].id;
  focusSelect.replaceChildren(
    ...data.people.map((p) => {
      const option = new Option(p.name + (state.shown.has(p.id) ? "" : " (hidden)"), p.id, false, p.id === state.focus);
      return option;
    }),
  );
}

function renderPeople(): void {
  const container = $("people");
  container.replaceChildren();
  for (const person of data.people) {
    const label = document.createElement("label");
    label.className = "check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.shown.has(person.id);
    input.addEventListener("change", () => {
      if (input.checked) state.shown.add(person.id);
      else state.shown.delete(person.id);
      const before = state.focus;
      renderFocusOptions();
      if (state.focus !== before) {
        state.selectedPoi = null;
        renderPlaces();
      }
      updateSwatches();
      fitDay();
      renderTime();
    });
    const name = document.createElement("span");
    name.textContent = person.name;
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.dataset.person = person.id;
    swatch.setAttribute("aria-hidden", "true");
    label.append(input, name, swatch);
    container.append(label);
  }
  updateSwatches();
}

function updateSwatches(): void {
  for (const swatch of document.querySelectorAll<HTMLElement>(".swatch[data-person]")) {
    swatch.classList.toggle("on", swatch.dataset.person === state.focus);
    swatch.hidden = !state.shown.has(swatch.dataset.person!);
  }
}

// Playback
let lastFrame = 0;
let frame = 0;
let mapVisible = true;

function tick(time: number): void {
  if (!state.playing || document.hidden || !mapVisible) {
    frame = 0;
    return;
  }
  const elapsed = lastFrame ? time - lastFrame : 0;
  lastFrame = time;
  state.minute = Math.min(1439, state.minute + elapsed * PLAY_SPEED);
  renderTimeRounded();
  if (state.minute >= 1439) {
    setPlaying(false);
    return;
  }
  frame = requestAnimationFrame(tick);
}

let lastDrawnMinute = -1;
function renderTimeRounded(): void {
  const minute = Math.floor(state.minute);
  if (minute === lastDrawnMinute) return;
  lastDrawnMinute = minute;
  const exact = state.minute;
  state.minute = minute;
  renderTime();
  state.minute = exact;
}

function resume(): void {
  if (state.playing && !frame && !document.hidden && mapVisible) {
    lastFrame = 0;
    frame = requestAnimationFrame(tick);
  }
}

function setPlaying(playing: boolean): void {
  state.playing = playing;
  playButton.textContent = playing ? "Pause" : "Play";
  if (playing) {
    if (state.minute >= 1439) state.minute = 0;
    resume();
  } else {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    state.minute = Math.floor(state.minute);
    renderTime();
  }
}

document.addEventListener("visibilitychange", resume);
new IntersectionObserver((entries) => {
  mapVisible = entries[0].isIntersecting;
  resume();
}).observe($("map"));

// Wiring
daySelect.replaceChildren(...DAYS.map((d, i) => new Option(d, String(i))));
daySelect.addEventListener("change", () => {
  state.day = Number(daySelect.value);
  fitDay();
  renderTime();
});
timeInput.addEventListener("input", () => {
  state.minute = Number(timeInput.value);
  renderTime();
});
playButton.addEventListener("click", () => setPlaying(!state.playing));
const step = (minutes: number) => {
  setPlaying(false);
  state.minute = Math.max(0, Math.min(1439, Math.floor(state.minute) + minutes));
  renderTime();
};
$("back").addEventListener("click", () => step(-15));
$("forward").addEventListener("click", () => step(15));

focusSelect.addEventListener("change", () => {
  state.focus = focusSelect.value;
  if (!state.shown.has(state.focus)) {
    state.shown.add(state.focus);
    renderPeople();
    renderFocusOptions();
    fitDay();
  }
  state.selectedPoi = null;
  updateSwatches();
  renderPlaces();
  renderTime();
});

function onDetectionChange(): void {
  state.radius = Number(radiusInput.value);
  state.minMinutes = Number(minutesInput.value);
  state.selectedPoi = null;
  renderDetectionOutputs();
  renderPlaces();
  renderTime();
}
radiusInput.addEventListener("input", onDetectionChange);
minutesInput.addEventListener("input", onDetectionChange);
$("reset-detection").addEventListener("click", () => {
  radiusInput.value = String(DEFAULT_RADIUS);
  minutesInput.value = String(DEFAULT_MIN_MINUTES);
  onDetectionChange();
});

// The explorer's height on wide screens depends on the header's.
const header = document.querySelector<HTMLElement>(".page-header")!;
const setHeaderHeight = () => document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
setHeaderHeight();
map.resize();

window.addEventListener("resize", () => {
  setHeaderHeight();
  map.resize();
});

renderPeople();
renderFocusOptions();
renderDetectionOutputs();
renderPlaces();
fitDay();
renderTime();
new Quiz($("quiz"), QUESTIONS);
