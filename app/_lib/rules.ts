// app/_lib/rules.ts
// スコア計算・サーブ位置・ローテーションなどのルールを純粋関数でまとめたもの
import type {
  BestOf,
  Court,
  Formation,
  MatchSettings,
  MatchState,
  Side,
} from "./types";

export function gamesNeeded(bestOf: BestOf): number {
  return Math.floor(bestOf / 2) + 1;
}

export function judgeGame(
  a: number,
  b: number,
  pointsToWin: number,
  cap: number,
): { over: boolean; winner?: Side } {
  if (a >= cap || b >= cap) return { over: true, winner: a > b ? "A" : "B" };
  const diff = Math.abs(a - b);
  if ((a >= pointsToWin || b >= pointsToWin) && diff >= 2) {
    return { over: true, winner: a > b ? "A" : "B" };
  }
  return { over: false };
}

// who が次の1点を取ったらゲームが終わるか
export function winsIfScores(
  a: number,
  b: number,
  who: Side,
  pointsToWin: number,
  cap: number,
): boolean {
  const na = who === "A" ? a + 1 : a;
  const nb = who === "B" ? b + 1 : b;
  return judgeGame(na, nb, pointsToWin, cap).over;
}

export function isDeuce(
  a: number,
  b: number,
  pointsToWin: number,
  cap: number,
): boolean {
  const threshold = pointsToWin - 1;
  return a >= threshold && b >= threshold && a === b && a < cap && b < cap;
}

// 偶奇からサービスコートを決定（偶数=R、奇数=L）
export function courtFromPoints(points: number): Court {
  return points % 2 === 0 ? "R" : "L";
}

// 対象サイドの左右をスワップ
export function swapPair(formation: Formation, side: Side): Formation {
  const p = formation[side];
  return { ...formation, [side]: { left: p.right, right: p.left } };
}

// 現在サーブを打つ「選手名」
export function currentServerName(state: MatchState): string {
  const pair = state.formation[state.server];
  return state.serverCourt === "L" ? pair.left : pair.right;
}

export function initialMatchState(formation: Formation): MatchState {
  return {
    gameIndex: 0,
    gamesWonA: 0,
    gamesWonB: 0,
    game: { a: 0, b: 0, over: false },
    matchOver: false,
    server: "A",
    serverCourt: "R",
    formation,
    flipped: false,
  };
}

// 1点加算（ゲーム中でなければ state をそのまま返す）
export function addPoint(
  state: MatchState,
  who: Side,
  settings: MatchSettings,
): MatchState {
  if (state.matchOver || state.game.over) return state;

  const nextA = state.game.a + (who === "A" ? 1 : 0);
  const nextB = state.game.b + (who === "B" ? 1 : 0);
  const judged = judgeGame(nextA, nextB, settings.pointsToWin, settings.cap);

  // サーブ側が得点 → サーブ継続＆サーブ側ペアの左右が入れ替わる
  // レシーブ側が得点 → サーブ権移動、並びはそのまま
  const serverScored = who === state.server;
  const serverPoints = who === "A" ? nextA : nextB;

  const next: MatchState = {
    ...state,
    game: { a: nextA, b: nextB, over: judged.over, winner: judged.winner },
    server: who,
    serverCourt: courtFromPoints(serverPoints),
    formation: serverScored
      ? swapPair(state.formation, state.server)
      : state.formation,
  };

  if (judged.over && judged.winner) {
    if (judged.winner === "A") next.gamesWonA += 1;
    else next.gamesWonB += 1;

    const need = gamesNeeded(settings.bestOf);
    if (next.gamesWonA >= need || next.gamesWonB >= need) {
      next.matchOver = true;
      next.matchWinner = next.gamesWonA > next.gamesWonB ? "A" : "B";
    }
  }

  return next;
}

// 次ゲーム開始：前ゲーム勝者がサーブ、0 点なので R から。並びは前ゲーム終了時のまま
export function startNextGame(state: MatchState): MatchState {
  if (!state.game.over || state.matchOver) return state;
  return {
    ...state,
    gameIndex: state.gameIndex + 1,
    game: { a: 0, b: 0, over: false },
    server: state.game.winner ?? state.server,
    serverCourt: "R",
  };
}

// マッチをリセット（並び・表示の左右はそのまま）
export function resetMatch(state: MatchState): MatchState {
  return {
    ...initialMatchState(state.formation),
    flipped: state.flipped,
  };
}

// 手動サーブ交代（誤操作時の救済）
export function swapServe(state: MatchState): MatchState {
  const nextServer: Side = state.server === "A" ? "B" : "A";
  const points = nextServer === "A" ? state.game.a : state.game.b;
  return {
    ...state,
    server: nextServer,
    serverCourt: courtFromPoints(points),
  };
}

// who がこの1点でゲームを取り、かつマッチも終わるか
export function isMatchPoint(
  state: MatchState,
  who: Side,
  settings: MatchSettings,
): boolean {
  if (state.matchOver || state.game.over) return false;
  const { a, b } = state.game;
  if (!winsIfScores(a, b, who, settings.pointsToWin, settings.cap))
    return false;
  const need = gamesNeeded(settings.bestOf);
  const wonA = state.gamesWonA + (who === "A" ? 1 : 0);
  const wonB = state.gamesWonB + (who === "B" ? 1 : 0);
  return wonA >= need || wonB >= need;
}

// インターバルを取る点数（21点制なら11点。15・11点制は規定点の半分を切り上げ）
export function intervalPoint(pointsToWin: number): number {
  return Math.ceil(pointsToWin / 2);
}

// ファイナルゲーム（3ゲームマッチの第3ゲーム、または1ゲームマッチ）か
export function isFinalGame(
  state: MatchState,
  settings: MatchSettings,
): boolean {
  return state.gameIndex === settings.bestOf - 1;
}

// prev → next の1点で、リードしている側が初めてインターバルの点数に達したか
export function reachedInterval(
  prev: MatchState,
  next: MatchState,
  settings: MatchSettings,
): boolean {
  if (next.gameIndex !== prev.gameIndex || next.game.over) return false;
  const point = intervalPoint(settings.pointsToWin);
  const before = Math.max(prev.game.a, prev.game.b);
  const after = Math.max(next.game.a, next.game.b);
  return before < point && after >= point;
}
