// app/_lib/types.ts
export type BestOf = 1 | 3;
export type PointsToWin = 11 | 15 | 21;
export type Mode = "singles" | "doubles";

export type MatchSettings = {
  bestOf: BestOf;
  pointsToWin: PointsToWin;
  cap: number;
  // ここでは settings に mode は含めず、URL パラメータで別管理でもOK
};

export type Side = "A" | "B";
export type Court = "L" | "R";

export type Pair = { left: string; right: string };
export type Formation = { A: Pair; B: Pair };

export type GameState = {
  a: number;
  b: number;
  over: boolean;
  winner?: Side;
};

export type MatchState = {
  gameIndex: number;
  gamesWonA: number;
  gamesWonB: number;
  game: GameState;
  matchOver: boolean;
  matchWinner?: Side;

  server: Side; // サーブ側（A/B）
  serverCourt: Court; // 現在サーブ位置（L/R）

  // ダブルス用：左右の並び
  formation: Formation;

  // 画面の左右にどちらのチームを表示するか（true なら左に B）
  flipped: boolean;
};
