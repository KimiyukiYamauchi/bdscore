"use client";

import { useMemo, useState } from "react";
import styles from "@/app/match/Scoreboard.module.css";

type Side = "A" | "B";

export type MatchSettings = {
  bestOf: 1 | 3;
  pointsToWin: 15 | 21;
  cap: number; // 15点制なら21、21点制なら30
};

type GameState = {
  a: number;
  b: number;
  over: boolean;
  winner?: Side;
};

type MatchState = {
  gameIndex: number;
  gamesWonA: number;
  gamesWonB: number;
  game: GameState;
  matchOver: boolean;
  matchWinner?: Side;

  // ★ 追加：サーブ権とサービスコート
  server: Side;           // いまサーブしている側
  serverCourt: "L" | "R"; // いまのサーブ位置（Left/Right）
};

type Snapshot = MatchState;

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function gamesNeeded(bestOf: 1 | 3): number {
  return Math.floor(bestOf / 2) + 1;
}

function winsIfScores(a: number, b: number, who: Side, pointsToWin: number, cap: number): boolean {
  const na = who === "A" ? a + 1 : a;
  const nb = who === "B" ? b + 1 : b;
  const diff = Math.abs(na - nb);
  if (na >= cap || nb >= cap) return true;
  if ((na >= pointsToWin || nb >= pointsToWin) && diff >= 2) return true;
  return false;
}

function judgeGame(a: number, b: number, pointsToWin: number, cap: number): { over: boolean; winner?: Side } {
  if (a >= cap || b >= cap) return { over: true, winner: a > b ? "A" : "B" };
  const diff = Math.abs(a - b);
  if ((a >= pointsToWin || b >= pointsToWin) && diff >= 2) {
    return { over: true, winner: a > b ? "A" : "B" };
  }
  return { over: false };
}

function isDeuce(a: number, b: number, pointsToWin: number, cap: number): boolean {
  const threshold = pointsToWin - 1;
  return a >= threshold && b >= threshold && a === b && a < cap && b < cap;
}

// ★ 偶奇からサービスコートを決定（偶数=R、奇数=L）
function courtFromPoints(points: number): "L" | "R" {
  return points % 2 === 0 ? "R" : "L";
}

export default function Scoreboard({ settings }: { settings: MatchSettings }) {
  const need = useMemo(() => gamesNeeded(settings.bestOf), [settings.bestOf]);

  const [state, setState] = useState<MatchState>({
    gameIndex: 0,
    gamesWonA: 0,
    gamesWonB: 0,
    game: { a: 0, b: 0, over: false },
    matchOver: false,
    // 初期サーブは A、0点なので R から
    server: "A",
    serverCourt: "R",
  });

  const [history, setHistory] = useState<Snapshot[]>([]);
  const pushHistory = () => setHistory((h) => [...h, deepClone(state)]);
  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setState(last);
      return h.slice(0, -1);
    });
  };

  const addPoint = (who: Side) => {
    if (state.matchOver || state.game.over) return;
    pushHistory();

    const nextA = state.game.a + (who === "A" ? 1 : 0);
    const nextB = state.game.b + (who === "B" ? 1 : 0);
    const judged = judgeGame(nextA, nextB, settings.pointsToWin, settings.cap);

    // ★ サーブ権とコートの更新
    let nextServer: Side;
    let nextCourt: "L" | "R";
    if (who === state.server) {
      // サーブ側が取った → サーブ継続、サーバー側の点で偶奇判定
      const serverPoints = who === "A" ? nextA : nextB;
      nextServer = state.server;
      nextCourt = courtFromPoints(serverPoints);
    } else {
      // レシーブ側が取った → サーブ権移動、新サーバーの点で偶奇判定
      nextServer = who;
      const serverPoints = nextServer === "A" ? nextA : nextB;
      nextCourt = courtFromPoints(serverPoints);
    }

    let next: MatchState = {
      ...state,
      game: { a: nextA, b: nextB, over: judged.over, winner: judged.winner },
      server: nextServer,
      serverCourt: nextCourt,
    };

    if (judged.over && judged.winner) {
      if (judged.winner === "A") next.gamesWonA += 1;
      else next.gamesWonB += 1;

      // ★ マッチ終了判定
      if (next.gamesWonA >= need || next.gamesWonB >= need) {
        next.matchOver = true;
        next.matchWinner = next.gamesWonA > next.gamesWonB ? "A" : "B";
      }
    }

    setState(next);
  };

  const nextGame = () => {
    if (!state.game.over || state.matchOver) return;
    pushHistory();

    // ★ 次ゲームの開始サーバー＝前ゲーム勝者、開始コートは 0 点なので R
    const starter: Side = state.game.winner ?? state.server;

    setState((s) => ({
      ...s,
      gameIndex: s.gameIndex + 1,
      game: { a: 0, b: 0, over: false },
      server: starter,
      serverCourt: "R",
    }));
  };

  const resetMatch = () => {
    pushHistory();
    setState({
      gameIndex: 0,
      gamesWonA: 0,
      gamesWonB: 0,
      game: { a: 0, b: 0, over: false },
      matchOver: false,
      matchWinner: undefined,
      server: "A",
      serverCourt: "R",
    });
  };

  // ★ 手動サーブ交代（誤操作時の救済）
  const swapServe = () => {
    pushHistory();
    const nextServer: Side = state.server === "A" ? "B" : "A";
    const points = nextServer === "A" ? state.game.a : state.game.b;
    setState({
      ...state,
      server: nextServer,
      serverCourt: courtFromPoints(points),
    });
  };

  const a = state.game.a;
  const b = state.game.b;

  const aGamePoint = !state.game.over && winsIfScores(a, b, "A", settings.pointsToWin, settings.cap);
  const bGamePoint = !state.game.over && winsIfScores(a, b, "B", settings.pointsToWin, settings.cap);

  const aMatchPoint = aGamePoint && state.gamesWonA === need - 1;
  const bMatchPoint = bGamePoint && state.gamesWonB === need - 1;

  const statusLine = (() => {
    if (state.matchOver) return `マッチ終了：${state.matchWinner} 勝利`;
    if (state.game.over) return `ゲーム終了：${state.game.winner} がこのゲームに勝利`;
    if (isDeuce(a, b, settings.pointsToWin, settings.cap)) return "デュース";
    if (aMatchPoint && bMatchPoint) return "両者マッチポイント";
    if (aMatchPoint) return "A マッチポイント";
    if (bMatchPoint) return "B マッチポイント";
    if (aGamePoint && bGamePoint) return "両者ゲームポイント";
    if (aGamePoint) return "A ゲームポイント";
    if (bGamePoint) return "B ゲームポイント";
    return "プレー中";
  })();

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>Game {state.gameIndex + 1} / Best of {settings.bestOf}（先取 {need}）</div>

        {/* ★ サーブ表示 */}
        <div className={styles.serve}>
          <span className={styles.serveLabel}>Serve:</span>
          <span className={styles.serveSide}>{state.server}</span>
          <span className={styles.courtBadge}>{state.serverCourt}</span>
        </div>
      </div>

      <div className={styles.status}>{statusLine}</div>

      <div className={styles.board}>
        <div className={styles.card}>
          <div className={styles.sideRow}>
            <div className={styles.side}>A</div>
            {state.server === "A" && (
              <div className={styles.servePill}>
                サーブ中 <span className={styles.courtMini}>{state.serverCourt}</span>
              </div>
            )}
          </div>
          <div className={styles.score}>{a}</div>
          <button
            className={styles.pointBtn}
            onClick={() => addPoint("A")}
            disabled={state.game.over || state.matchOver}
            aria-label="Aに1点加算"
          >
            A +1
          </button>
          <div className={styles.games}>Games: {state.gamesWonA}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.sideRow}>
            <div className={styles.side}>B</div>
            {state.server === "B" && (
              <div className={styles.servePill}>
                サーブ中 <span className={styles.courtMini}>{state.serverCourt}</span>
              </div>
            )}
          </div>
          <div className={styles.score}>{b}</div>
          <button
            className={styles.pointBtn}
            onClick={() => addPoint("B")}
            disabled={state.game.over || state.matchOver}
            aria-label="Bに1点加算"
          >
            B +1
          </button>
          <div className={styles.games}>Games: {state.gamesWonB}</div>
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.ctrlBtn} onClick={undo} disabled={history.length === 0}>
          アンドゥ
        </button>
        <button
          className={styles.ctrlBtn}
          onClick={nextGame}
          disabled={!state.game.over || state.matchOver}
          title="ゲームが終わっている時だけ有効"
        >
          次のゲーム
        </button>
        <button className={styles.ctrlBtn} onClick={swapServe} disabled={state.matchOver}>
          サーブ交代
        </button>
        <button className={styles.dangerBtn} onClick={resetMatch}>
          マッチをリセット
        </button>
      </div>

      <div className={styles.meta}>
        <span>Points to Win: {settings.pointsToWin}</span>
        <span>Cap: {settings.cap}</span>
      </div>
    </div>
  );
}
