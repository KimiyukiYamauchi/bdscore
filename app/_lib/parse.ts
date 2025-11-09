import type { BestOf, PointsToWin, MatchSettings } from "./types";

export function toBestOf(v: unknown, fallback: BestOf = 3): BestOf {
  const n = Number(v);
  return (n === 1 || n === 3) ? (n as BestOf) : fallback;
}

export function toPointsToWin(v: unknown, fallback: PointsToWin = 21): PointsToWin {
  const n = Number(v);
  return (n === 15 || n === 21) ? (n as PointsToWin) : fallback;
}

// cap は運用に合わせて：21点制なら30、15点制なら21 をデフォルトにしています
export function buildSettings(bestOfRaw: unknown, ptwRaw: unknown): MatchSettings {
  const bestOf = toBestOf(bestOfRaw);
  const pointsToWin = toPointsToWin(ptwRaw);
  const cap = pointsToWin === 21 ? 30 : 21;
  return { bestOf, pointsToWin, cap };
}
