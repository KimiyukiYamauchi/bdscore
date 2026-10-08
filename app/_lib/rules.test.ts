import { describe, expect, it } from "vitest";
import { buildSettings } from "./parse";
import {
  addPoint,
  courtFromPoints,
  currentServerName,
  initialMatchState,
  intervalPoint,
  isDeuce,
  isFinalGame,
  isMatchPoint,
  judgeGame,
  reachedInterval,
  resetMatch,
  startNextGame,
  swapServe,
} from "./rules";
import type { MatchSettings, MatchState, Side } from "./types";

const FORMATION = {
  A: { left: "a1", right: "a2" },
  B: { left: "b1", right: "b2" },
};

const bo1_21 = buildSettings(1, 21);
const bo3_21 = buildSettings(3, 21);

// 指定した順に得点を加算する
function play(state: MatchState, points: Side[], settings: MatchSettings) {
  return points.reduce((s, who) => addPoint(s, who, settings), state);
}

// A と B に指定点数を交互に近い形で入れる（デュース等の局面を作る用）
function playTo(a: number, b: number, settings: MatchSettings) {
  const seq: Side[] = [];
  for (let i = 0; i < Math.max(a, b); i++) {
    if (i < a) seq.push("A");
    if (i < b) seq.push("B");
  }
  return play(initialMatchState(FORMATION), seq, settings);
}

describe("buildSettings", () => {
  it.each([
    [11, 15],
    [15, 21],
    [21, 30],
  ])("%i 点先取の上限は %i", (ptw, cap) => {
    expect(buildSettings(3, ptw).cap).toBe(cap);
  });
});

describe("judgeGame", () => {
  it("2点差がつけば規定点で終了", () => {
    expect(judgeGame(21, 19, 21, 30)).toEqual({ over: true, winner: "A" });
    expect(judgeGame(9, 11, 11, 15)).toEqual({ over: true, winner: "B" });
  });

  it("1点差では終了しない", () => {
    expect(judgeGame(21, 20, 21, 30).over).toBe(false);
    expect(judgeGame(14, 14, 11, 15).over).toBe(false);
  });

  it("上限に達したら1点差でも終了", () => {
    expect(judgeGame(30, 29, 21, 30)).toEqual({ over: true, winner: "A" });
    expect(judgeGame(14, 15, 11, 15)).toEqual({ over: true, winner: "B" });
    expect(judgeGame(20, 21, 15, 21)).toEqual({ over: true, winner: "B" });
  });
});

describe("isDeuce", () => {
  it("規定点-1 以上で同点ならデュース", () => {
    expect(isDeuce(20, 20, 21, 30)).toBe(true);
    expect(isDeuce(29, 29, 21, 30)).toBe(true);
    expect(isDeuce(10, 10, 11, 15)).toBe(true);
  });
  it("それ以外はデュースではない", () => {
    expect(isDeuce(19, 19, 21, 30)).toBe(false);
    expect(isDeuce(21, 20, 21, 30)).toBe(false);
  });
});

describe("courtFromPoints", () => {
  it("偶数なら R、奇数なら L", () => {
    expect(courtFromPoints(0)).toBe("R");
    expect(courtFromPoints(1)).toBe("L");
    expect(courtFromPoints(20)).toBe("R");
  });
});

describe("addPoint（サーブとローテーション）", () => {
  it("サーブ側が得点するとサーブ継続・ペアの左右が入れ替わる", () => {
    const s = addPoint(initialMatchState(FORMATION), "A", bo1_21);
    expect(s.game).toMatchObject({ a: 1, b: 0 });
    expect(s.server).toBe("A");
    expect(s.serverCourt).toBe("L");
    expect(s.formation.A).toEqual({ left: "a2", right: "a1" });
    expect(s.formation.B).toEqual(FORMATION.B);
    // 最初に R から打った a2 が L に移って続けてサーブ
    expect(currentServerName(s)).toBe("a2");
  });

  it("レシーブ側が得点するとサーブ権が移り、並びは変わらない", () => {
    const s = addPoint(initialMatchState(FORMATION), "B", bo1_21);
    expect(s.server).toBe("B");
    expect(s.serverCourt).toBe("L"); // B は 1 点（奇数）
    expect(s.formation).toEqual(FORMATION);
    expect(currentServerName(s)).toBe("b1");
  });

  it("ゲーム終了後の加算は無視される（同じ参照を返す）", () => {
    const over = playTo(21, 0, bo1_21);
    expect(over.matchOver).toBe(true);
    expect(addPoint(over, "B", bo1_21)).toBe(over);
  });
});

describe("マッチの進行", () => {
  it("1ゲームマッチは1ゲーム取ればマッチ終了", () => {
    const s = playTo(21, 15, bo1_21);
    expect(s.gamesWonA).toBe(1);
    expect(s.matchOver).toBe(true);
    expect(s.matchWinner).toBe("A");
  });

  it("3ゲームマッチは1ゲーム目ではマッチが終わらず、次ゲームは勝者が R からサーブ", () => {
    const s = playTo(10, 21, bo3_21);
    expect(s.game).toMatchObject({ over: true, winner: "B" });
    expect(s.matchOver).toBe(false);

    const next = startNextGame(s);
    expect(next.gameIndex).toBe(1);
    expect(next.game).toEqual({ a: 0, b: 0, over: false });
    expect(next.server).toBe("B");
    expect(next.serverCourt).toBe("R");
    expect(next.gamesWonB).toBe(1);
  });

  it("ゲーム中は次ゲームに進めない", () => {
    const s = playTo(3, 2, bo3_21);
    expect(startNextGame(s)).toBe(s);
  });

  it("マッチポイントは「この1点でマッチが終わる」時だけ", () => {
    const g1 = playTo(20, 10, bo3_21);
    expect(isMatchPoint(g1, "A", bo3_21)).toBe(false);

    const g2 = play(
      startNextGame(addPoint(g1, "A", bo3_21)),
      Array<Side>(20).fill("A"),
      bo3_21,
    );
    expect(g2.game).toMatchObject({ a: 20, b: 0 });
    expect(isMatchPoint(g2, "A", bo3_21)).toBe(true);
    expect(isMatchPoint(g2, "B", bo3_21)).toBe(false);
  });
});

describe("手動操作", () => {
  it("リセットはスコアを戻し、並びと表示の左右は保つ", () => {
    const s = { ...playTo(5, 3, bo3_21), flipped: true };
    const r = resetMatch(s);
    expect(r.game).toEqual({ a: 0, b: 0, over: false });
    expect(r.server).toBe("A");
    expect(r.formation).toEqual(s.formation);
    expect(r.flipped).toBe(true);
  });

  it("サーブ交代は相手側の点数の偶奇でコートが決まる", () => {
    const s = playTo(2, 3, bo1_21); // 最後に B が得点 → B サーブ
    const swapped = swapServe(s);
    expect(swapped.server).toBe(s.server === "A" ? "B" : "A");
    const pts = swapped.server === "A" ? s.game.a : s.game.b;
    expect(swapped.serverCourt).toBe(courtFromPoints(pts));
  });
});

describe("インターバルとエンド交代", () => {
  it.each([
    [21, 11],
    [15, 8],
    [11, 6],
  ])("%i 点制のインターバルは %i 点", (ptw, point) => {
    expect(intervalPoint(ptw)).toBe(point);
  });

  it("リードしている側が初めて11点に達した1点だけで true", () => {
    const at10 = playTo(10, 7, bo1_21);
    const at11 = addPoint(at10, "A", bo1_21);
    expect(reachedInterval(at10, at11, bo1_21)).toBe(true);

    // その後に相手が11点に達してもインターバルにはならない
    const b10 = playTo(11, 10, bo1_21);
    expect(reachedInterval(b10, addPoint(b10, "B", bo1_21), bo1_21)).toBe(
      false,
    );
  });

  it("11点に届かない得点では false", () => {
    const s = playTo(5, 5, bo1_21);
    expect(reachedInterval(s, addPoint(s, "A", bo1_21), bo1_21)).toBe(false);
  });

  it("ファイナルゲームは3ゲームマッチの第3ゲーム、1ゲームマッチの第1ゲーム", () => {
    const first = initialMatchState(FORMATION);
    expect(isFinalGame(first, bo1_21)).toBe(true);
    expect(isFinalGame(first, bo3_21)).toBe(false);
    expect(isFinalGame({ ...first, gameIndex: 2 }, bo3_21)).toBe(true);
  });
});
