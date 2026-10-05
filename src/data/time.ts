export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAY_SECONDS = 86400;
export const WEEK_SECONDS = 7 * DAY_SECONDS;

// Times are seconds since Monday 00:00, local time. There's no calendar on purpose: this week never happened.
export function at(day: number, hours: number, minutes = 0): number {
  return day * DAY_SECONDS + hours * 3600 + minutes * 60;
}

export function dayOf(t: number): number {
  return Math.floor(t / DAY_SECONDS);
}

export function clock(t: number): string {
  const s = ((t % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dayAndClock(t: number): string {
  return `${DAYS[dayOf(t)]} ${clock(t)}`;
}
