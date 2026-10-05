import L from "leaflet";
import type { Poi } from "../analysis/staypoints.ts";
import type { Fix } from "../data/generate.ts";
import type { LatLon } from "../data/geo.ts";

export interface PersonView {
  id: string;
  name: string;
  trace: Fix[];
  position: Fix | null;
  stale: boolean;
  focus: boolean;
}

const AMBER = "#EA9A27";
const AMBER_BRIGHT = "#FFB44A";
const GREY = "#A5B1BC";
const NAVY = "#0D161C";
// Longer than this without a fix and the trace is cut, so a gap reads as a gap and not as a straight line.
const BREAK_AFTER = 10 * 60;

function segments(trace: Fix[]): L.LatLngTuple[][] {
  const parts: L.LatLngTuple[][] = [];
  let current: L.LatLngTuple[] = [];
  trace.forEach((f, i) => {
    if (i > 0 && f.t - trace[i - 1].t > BREAK_AFTER) {
      parts.push(current);
      current = [];
    }
    current.push([f.lat, f.lon]);
  });
  parts.push(current);
  return parts.filter((part) => part.length > 1);
}

export class TraceMap {
  private readonly map: L.Map;
  private readonly traces = L.layerGroup();
  private readonly dots = L.layerGroup();
  private readonly pois = L.layerGroup();
  private readonly onPoi: (id: number) => void;

  constructor(element: HTMLElement, reducedMotion: boolean, onPoi: (id: number) => void) {
    this.onPoi = onPoi;
    this.map = L.map(element, {
      preferCanvas: true,
      zoomAnimation: !reducedMotion,
      fadeAnimation: !reducedMotion,
      markerZoomAnimation: !reducedMotion,
    }).setView([45.765, 4.86], 13);
    // Standard OpenStreetMap tiles. The stylesheet turns them grey and dark so the traces stand out.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    this.traces.addTo(this.map);
    this.pois.addTo(this.map);
    this.dots.addTo(this.map);
  }

  draw(people: PersonView[]): void {
    this.traces.clearLayers();
    this.dots.clearLayers();
    // Focused person last, so the amber trace sits on top of the grey ones.
    const ordered = [...people].sort((a, b) => Number(a.focus) - Number(b.focus));
    for (const person of ordered) {
      if (person.trace.length > 1) {
        L.polyline(
          segments(person.trace),
          person.focus ? { color: AMBER, weight: 3, opacity: 0.95 } : { color: GREY, weight: 2, opacity: 0.55 },
        ).addTo(this.traces);
      }
      if (person.position) {
        const p = person.position;
        L.circleMarker([p.lat, p.lon], {
          radius: person.focus ? 8 : 6,
          color: NAVY,
          weight: 2,
          fillColor: person.focus ? AMBER_BRIGHT : GREY,
          fillOpacity: person.stale ? 0.45 : 1,
          interactive: false,
        })
          .bindTooltip(person.stale ? `${person.name}, no signal` : person.name, {
            permanent: true,
            direction: "right",
            offset: [10, 0],
            className: `name-tag${person.focus ? " focus" : ""}`,
          })
          .addTo(this.dots);
      }
    }
  }

  showPois(pois: Poi[], selected: number | null): void {
    this.pois.clearLayers();
    for (const poi of pois) {
      const label = poi.place?.label ?? "an unlabelled spot";
      const marker = L.marker([poi.lat, poi.lon], {
        icon: L.divIcon({
          className: `poi-marker${poi.id === selected ? " selected" : ""}`,
          html: "<span></span>",
          iconSize: [44, 44],
        }),
        title: label,
        alt: `Place: ${label}`,
        keyboard: true,
        riseOnHover: true,
        zIndexOffset: poi.id === selected ? 1000 : 0,
      });
      marker.on("click", () => this.onPoi(poi.id));
      marker.addTo(this.pois);
    }
  }

  fit(points: LatLon[]): void {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as L.LatLngTuple));
    this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
  }

  panTo(p: LatLon): void {
    this.map.panTo([p.lat, p.lon], { animate: false });
  }

  resize(): void {
    this.map.invalidateSize();
  }
}
