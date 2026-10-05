import { hourlyMinutes, totalTime, type Poi, type Stay } from "../analysis/staypoints.ts";
import { clock, DAYS, dayOf } from "../data/time.ts";

const SVG = "http://www.w3.org/2000/svg";

export function placeName(poi: Poi): string {
  return poi.place?.label ?? "an unlabelled spot";
}

export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function duration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes} min`;
  return `${Math.round(minutes / 60)} h`;
}

function visitText(visit: Stay): string {
  const day = (t: number) => DAYS[dayOf(t)].slice(0, 3);
  if (dayOf(visit.start) === dayOf(visit.end)) return `${day(visit.start)} ${clock(visit.start)}–${clock(visit.end)}`;
  return `${day(visit.start)} ${clock(visit.start)} to ${day(visit.end)} ${clock(visit.end)}`;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>) {
  const el = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
  return el;
}

function hourChart(poi: Poi): SVGSVGElement {
  const minutes = hourlyMinutes(poi);
  const peak = Math.max(...minutes, 1);
  const busiest = minutes.indexOf(peak);
  const width = 336;
  const height = 132;
  const top = 8;
  const bottom = 22;
  const plot = height - top - bottom;
  const slot = width / 24;
  const chart = svg("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart", role: "img" });
  chart.setAttribute(
    "aria-label",
    `Time spent here by hour of the day, over the week. The busiest hour is ${String(busiest).padStart(2, "0")}:00, with ${Math.round(peak)} minutes in total.`,
  );
  chart.append(svg("line", { x1: 0, x2: width, y1: top + plot, y2: top + plot, class: "axis" }));
  minutes.forEach((value, hour) => {
    if (value <= 0) return;
    const h = Math.max(2, (value / peak) * plot);
    const x = hour * slot + 1;
    const w = slot - 2;
    const r = Math.min(4, w / 2, h / 2);
    const y = top + plot - h;
    // Rounded top, square base on the axis.
    const bar = svg("path", {
      class: "bar",
      d: `M${x},${top + plot} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${top + plot} Z`,
    });
    const title = svg("title", {});
    title.textContent = `${String(hour).padStart(2, "0")}:00 to ${String(hour + 1).padStart(2, "0")}:00, ${Math.round(value)} min`;
    bar.append(title);
    chart.append(bar);
  });
  for (const hour of [0, 6, 12, 18, 24]) {
    const label = svg("text", {
      x: Math.min(width - 2, Math.max(2, hour * slot)),
      y: height - 4,
      "text-anchor": hour === 0 ? "start" : hour === 24 ? "end" : "middle",
    });
    label.textContent = `${String(hour).padStart(2, "0")}:00`;
    chart.append(label);
  }
  return chart;
}

const KINDS: Record<string, string> = {
  home: "Home",
  university: "University campus",
  station: "Train station",
  office: "Office",
  shop: "Shop",
  square: "Public square",
  park: "Park",
  theatre: "Theatre",
  "climbing gym": "Climbing gym",
  stadium: "Stadium",
  supermarket: "Supermarket",
};

export function renderPoiDetails(container: HTMLElement, poi: Poi): void {
  container.replaceChildren();
  container.append(element("h3", undefined, capitalise(placeName(poi))));
  container.append(
    element(
      "p",
      "meta",
      poi.place ? `${KINDS[poi.place.kind]}, ${poi.place.area}` : "No known place within 250 m of this spot.",
    ),
  );
  container.append(element("p", undefined, `${poi.visits.length} ${poi.visits.length === 1 ? "visit" : "visits"}, ${duration(totalTime(poi))} in total:`));
  const visits = element("ul", "visits");
  for (const visit of poi.visits) visits.append(element("li", undefined, visitText(visit)));
  container.append(visits);
  container.append(hourChart(poi));
  container.append(element("p", "chart-caption", "Minutes spent here in each hour of the day, added up over the week."));
}

export function renderPoiList(list: HTMLElement, pois: Poi[], selected: number | null, onSelect: (id: number) => void): void {
  list.replaceChildren();
  const sorted = [...pois].sort((a, b) => totalTime(b) - totalTime(a));
  for (const poi of sorted) {
    const item = element("li");
    const button = element("button", "poi-button");
    button.type = "button";
    button.setAttribute("aria-pressed", String(poi.id === selected));
    button.append(element("span", undefined, capitalise(placeName(poi))), element("span", "hours", duration(totalTime(poi))));
    button.addEventListener("click", () => onSelect(poi.id));
    item.append(button);
    list.append(item);
  }
}
