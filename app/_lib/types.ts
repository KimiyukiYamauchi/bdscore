// app/_lib/types.ts
export type BestOf = 1 | 3;
export type PointsToWin = 15 | 21;
export type Mode = "singles" | "doubles";

export type MatchSettings = {
  bestOf: BestOf;
  pointsToWin: PointsToWin;
  cap: number;
  // ここでは settings に mode は含めず、URL パラメータで別管理でもOK
};

export type Pair = { left: string; right: string };
export type Formation = { A: Pair; B: Pair };
