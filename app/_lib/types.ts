export type BestOf = 1 | 3;
export type PointsToWin = 15 | 21;

export type MatchSettings = {
  bestOf: BestOf;          // 1 or 3（1ゲームマッチ or 3ゲームマッチ）
  pointsToWin: PointsToWin;// 15 or 21
  cap: number;             // 上限（例：21→30、15→21 など運用に応じて）
};
