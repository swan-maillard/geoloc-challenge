import type { LatLon } from "./geo.ts";

export type Mode = "walk" | "bike" | "car" | "tram" | "metro" | "train";

export interface Route {
  from: string;
  to: string;
  via: LatLon[];
  // One speed per leg, in km/h. A single value applies to every leg.
  speeds: number[];
  mode: Mode;
}

const p = (lat: number, lon: number): LatLon => ({ lat, lon });

export const ROUTES = {
  inesBike: {
    from: "home-ines",
    to: "insa",
    via: [p(45.769, 4.852), p(45.772, 4.8545), p(45.7765, 4.854), p(45.781, 4.8565), p(45.7832, 4.86), p(45.7845, 4.868)],
    speeds: [16],
    mode: "bike",
  },
  inesToPark: { from: "home-ines", to: "tete-d-or", via: [p(45.769, 4.852), p(45.772, 4.8545)], speeds: [4.5], mode: "walk" },
  tomWalk: { from: "home-villeurbanne", to: "insa", via: [p(45.774, 4.883), p(45.78, 4.88)], speeds: [5], mode: "walk" },
  tomTramToStadium: {
    from: "home-villeurbanne",
    to: "stadium",
    via: [p(45.765, 4.9), p(45.7612, 4.9216), p(45.764, 4.96)],
    speeds: [5, 22, 30, 25],
    mode: "tram",
  },
  toSupermarket: { from: "home-villeurbanne", to: "supermarket", via: [p(45.7705, 4.887)], speeds: [4.5], mode: "walk" },
  hugoMetro: { from: "home-villeurbanne", to: "part-dieu-office", via: [p(45.7697, 4.8635)], speeds: [30], mode: "metro" },
  hugoMetroToGym: { from: "part-dieu-office", to: "climbing-gym", via: [p(45.7606, 4.8593), p(45.7425, 4.84)], speeds: [30], mode: "metro" },
  hugoMetroHomeToGym: {
    from: "home-villeurbanne",
    to: "climbing-gym",
    via: [p(45.7697, 4.8635), p(45.7606, 4.8593), p(45.7425, 4.84)],
    speeds: [30],
    mode: "metro",
  },
  malikCar: {
    from: "home-malik",
    to: "insa",
    via: [p(45.742, 4.903), p(45.752, 4.9035), p(45.76, 4.9038), p(45.77, 4.904), p(45.779, 4.899), p(45.783, 4.888)],
    speeds: [35, 55, 70, 70, 70, 50, 35],
    mode: "car",
  },
  malikToStadium: { from: "home-malik", to: "stadium", via: [p(45.748, 4.94), p(45.76, 4.97)], speeds: [40, 60, 30], mode: "car" },
  camilleWalk: { from: "home-camille", to: "hotel-de-ville-office", via: [p(45.7745, 4.833), p(45.77, 4.8345)], speeds: [4.5], mode: "walk" },
  camilleToTheatre: { from: "home-camille", to: "theatre", via: [p(45.779, 4.83)], speeds: [4.5], mode: "walk" },
  camilleToSquare: { from: "home-camille", to: "croix-rousse-square", via: [p(45.777, 4.8325)], speeds: [4.5], mode: "walk" },
  camilleLunch: { from: "hotel-de-ville-office", to: "saint-jean", via: [p(45.765, 4.831), p(45.7625, 4.8285)], speeds: [4.5], mode: "walk" },
  leaWalk: { from: "home-lea", to: "republique-shop", via: [p(45.7555, 4.8395), p(45.759, 4.837)], speeds: [4.5], mode: "walk" },
  leaToPartDieu: { from: "home-lea", to: "part-dieu", via: [p(45.756, 4.85), p(45.759, 4.857)], speeds: [4.5], mode: "walk" },
  tgvToParis: {
    from: "part-dieu",
    to: "paris-gare-de-lyon",
    via: [p(45.79, 4.88), p(45.86, 4.9), p(46.2817, 4.7792), p(46.7655, 4.4997), p(47.3, 4.1), p(47.9, 3.5), p(48.5, 2.8), p(48.78, 2.45)],
    speeds: [50, 110, 270, 300, 300, 300, 300, 160, 60],
    mode: "train",
  },
  parisWalk: { from: "paris-gare-de-lyon", to: "paris-office", via: [p(48.842, 2.377)], speeds: [4.5], mode: "walk" },
  leaToSaintJean: { from: "home-lea", to: "saint-jean", via: [p(45.756, 4.837), p(45.7578, 4.832), p(45.76, 4.829)], speeds: [4.5], mode: "walk" },
  leaToBellecour: { from: "home-lea", to: "bellecour", via: [p(45.756, 4.837)], speeds: [4.5], mode: "walk" },
} satisfies Record<string, Route>;

export type RouteId = keyof typeof ROUTES;
