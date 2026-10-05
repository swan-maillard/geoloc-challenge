export interface LatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distance(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function offset(p: LatLon, northMetres: number, eastMetres: number): LatLon {
  return {
    lat: p.lat + (northMetres / EARTH_RADIUS) * (180 / Math.PI),
    lon: p.lon + (eastMetres / (EARTH_RADIUS * Math.cos(toRad(p.lat)))) * (180 / Math.PI),
  };
}

export function lerp(a: LatLon, b: LatLon, f: number): LatLon {
  return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
}

// Flat-earth projection around p. Good to a few metres at city scale.
function toMetres(origin: LatLon, p: LatLon): [number, number] {
  return [
    toRad(p.lon - origin.lon) * EARTH_RADIUS * Math.cos(toRad(origin.lat)),
    toRad(p.lat - origin.lat) * EARTH_RADIUS,
  ];
}

export function distanceToSegment(p: LatLon, a: LatLon, b: LatLon): number {
  const [bx, by] = toMetres(a, b);
  const [px, py] = toMetres(a, p);
  const lengthSq = bx * bx + by * by;
  const f = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / lengthSq));
  return Math.hypot(px - f * bx, py - f * by);
}
