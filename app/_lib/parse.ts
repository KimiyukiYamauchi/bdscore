import type {
  BestOf,
  PointsToWin,
  MatchSettings,
  Mode,
  Formation,
} from "./types";

export function toBestOf(v: unknown, fallback: BestOf = 3): BestOf {
  const n = Number(v);
  return n === 1 || n === 3 ? (n as BestOf) : fallback;
}
export function toPointsToWin(
  v: unknown,
  fallback: PointsToWin = 21
): PointsToWin {
  const n = Number(v);
  return n === 15 || n === 21 ? (n as PointsToWin) : fallback;
}
export function buildSettings(
  bestOfRaw: unknown,
  ptwRaw: unknown
): MatchSettings {
  const bestOf = toBestOf(bestOfRaw);
  const pointsToWin = toPointsToWin(ptwRaw);
  const cap = pointsToWin === 21 ? 30 : 21;
  return { bestOf, pointsToWin, cap };
}

export function toMode(v: unknown, fallback: Mode = "doubles"): Mode {
  return v === "singles" || v === "doubles" ? v : fallback;
}

// クエリから formation を作る（無ければデフォルト）
export function buildFormation(sp: Record<string, any>, mode: Mode): Formation {
  if (mode === "doubles") {
    const aL = (sp.aL as string) || "A-L";
    const aR = (sp.aR as string) || "A-R";
    const bL = (sp.bL as string) || "B-L";
    const bR = (sp.bR as string) || "B-R";
    return { A: { left: aL, right: aR }, B: { left: bL, right: bR } };
  } else {
    // singles のときは左に選手名、右は空でもOK
    const a = (sp.a as string) || "A";
    const b = (sp.b as string) || "B";
    return { A: { left: a, right: "" }, B: { left: b, right: "" } };
  }
}
