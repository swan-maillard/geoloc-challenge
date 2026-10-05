import type { LatLon } from "./geo.ts";

export type PlaceKind =
  | "home"
  | "university"
  | "station"
  | "office"
  | "shop"
  | "square"
  | "park"
  | "theatre"
  | "climbing gym"
  | "stadium"
  | "supermarket";

export interface Place extends LatLon {
  id: string;
  label: string;
  kind: PlaceKind;
  area: string;
}

// Public places are where they really are. Homes are points picked in residential areas, not addresses.
export const PLACES: Place[] = [
  { id: "home-ines", label: "home (approximate)", kind: "home", area: "Brotteaux, Lyon 6th", lat: 45.7672, lon: 4.8478 },
  { id: "home-villeurbanne", label: "home (approximate)", kind: "home", area: "Villeurbanne, near Gratte-Ciel", lat: 45.7695, lon: 4.8835 },
  { id: "home-lea", label: "home (approximate)", kind: "home", area: "La Guillotière, Lyon 7th", lat: 45.7525, lon: 4.8445 },
  { id: "home-camille", label: "home (approximate)", kind: "home", area: "Croix-Rousse, Lyon 4th", lat: 45.78, lon: 4.834 },
  { id: "home-malik", label: "home (approximate)", kind: "home", area: "Bron", lat: 45.7385, lon: 4.912 },
  { id: "insa", label: "INSA Lyon, La Doua campus", kind: "university", area: "Villeurbanne", lat: 45.7838, lon: 4.877 },
  { id: "part-dieu", label: "Lyon Part-Dieu station", kind: "station", area: "Lyon 3rd", lat: 45.7606, lon: 4.8593 },
  { id: "part-dieu-office", label: "an office building near Part-Dieu", kind: "office", area: "Lyon 3rd", lat: 45.7638, lon: 4.852 },
  { id: "republique-shop", label: "a shop on rue de la République", kind: "shop", area: "Lyon 2nd", lat: 45.762, lon: 4.836 },
  { id: "hotel-de-ville-office", label: "an office near the Hôtel de Ville", kind: "office", area: "Lyon 1st", lat: 45.7672, lon: 4.8365 },
  { id: "bellecour", label: "Place Bellecour", kind: "square", area: "Lyon 2nd", lat: 45.7578, lon: 4.832 },
  { id: "croix-rousse-square", label: "Place de la Croix-Rousse", kind: "square", area: "Croix-Rousse, Lyon 4th", lat: 45.7743, lon: 4.8318 },
  { id: "theatre", label: "Théâtre de la Croix-Rousse", kind: "theatre", area: "Croix-Rousse, Lyon 4th", lat: 45.7766, lon: 4.827 },
  { id: "saint-jean", label: "Place Saint-Jean, Vieux Lyon", kind: "square", area: "Lyon 5th", lat: 45.7606, lon: 4.8272 },
  { id: "tete-d-or", label: "Parc de la Tête d'Or", kind: "park", area: "Lyon 6th", lat: 45.7765, lon: 4.853 },
  { id: "climbing-gym", label: "a climbing gym in Gerland", kind: "climbing gym", area: "Gerland, Lyon 7th", lat: 45.7337, lon: 4.834 },
  { id: "stadium", label: "Groupama Stadium", kind: "stadium", area: "Décines-Charpieu", lat: 45.7653, lon: 4.9819 },
  { id: "supermarket", label: "a supermarket in Villeurbanne", kind: "supermarket", area: "Villeurbanne", lat: 45.7712, lon: 4.8905 },
  { id: "paris-gare-de-lyon", label: "Paris Gare de Lyon station", kind: "station", area: "Paris 12th", lat: 48.8443, lon: 2.374 },
  { id: "paris-office", label: "an office near Bercy", kind: "office", area: "Paris 12th", lat: 48.838, lon: 2.382 },
];

export function placeById(id: string): Place {
  const place = PLACES.find((p) => p.id === id);
  if (!place) throw new Error(`Unknown place ${id}`);
  return place;
}

// A rough box around Parc de la Tête d'Or. Bikes and people on foot can cross it, cars, buses and trams can't.
export const TETE_D_OR_PARK = { south: 45.7715, north: 45.7835, west: 4.846, east: 4.86 };

// A made-up speed camera on the boulevard Laurent-Bonnevay, where the limit is 70 km/h.
export const SPEED_CAMERA: LatLon = { lat: 45.76, lon: 4.9038 };
