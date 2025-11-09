"use client";

import { useMemo, useState } from "react";
import styles from "@/app/match/Scoreboard.module.css";

type Side = "A" | "B";
type Court = "L" | "R";
type Mode = "singles" | "doubles";

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

type Pair = { left: string; right: string };

type MatchState = {
  gameIndex: number;
  gamesWonA: number;
  gamesWonB: number;
  game: GameState;
  matchOver: boolean;
  matchWinner?: Side;

  server: Side; // サーブ側（A/B）
  serverCourt: Court; // 現在サーブ位置（L/R）

  // ★ ダブルス用：左右の並び
  formation: {
    A: Pair;
    B: Pair;
  };
};

type Snapshot = MatchState;

const safeText = (s: string | undefined, fallback: string) =>
  s && s.trim().length > 0 ? s : fallback;

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function gamesNeeded(bestOf: 1 | 3): number {
  return Math.floor(bestOf / 2) + 1;
}

function winsIfScores(
  a: number,
  b: number,
  who: Side,
  pointsToWin: number,
  cap: number
): boolean {
  const na = who === "A" ? a + 1 : a;
  const nb = who === "B" ? b + 1 : b;
  const diff = Math.abs(na - nb);
  if (na >= cap || nb >= cap) return true;
  if ((na >= pointsToWin || nb >= pointsToWin) && diff >= 2) return true;
  return false;
}

function judgeGame(
  a: number,
  b: number,
  pointsToWin: number,
  cap: number
): { over: boolean; winner?: Side } {
  if (a >= cap || b >= cap) return { over: true, winner: a > b ? "A" : "B" };
  const diff = Math.abs(a - b);
  if ((a >= pointsToWin || b >= pointsToWin) && diff >= 2) {
    return { over: true, winner: a > b ? "A" : "B" };
  }
  return { over: false };
}

function isDeuce(
  a: number,
  b: number,
  pointsToWin: number,
  cap: number
): boolean {
  const threshold = pointsToWin - 1;
  return a >= threshold && b >= threshold && a === b && a < cap && b < cap;
}

// 偶奇からサービスコートを決定（偶数=R、奇数=L）
function courtFromPoints(points: number): Court {
  return points % 2 === 0 ? "R" : "L";
}

// ★ 回転（ダブルス時のみ使用）：対象サイドの左右をスワップ
function rotateServingSide(formation: { A: Pair; B: Pair }, side: Side) {
  const f = deepClone(formation);
  const p = f[side];
  f[side] = { left: p.right, right: p.left };
  return f;
}

// 現在サーブを打つ「選手名」を返す（視覚表示用）
function currentServerName(state: MatchState): string {
  const side = state.server;
  const court = state.serverCourt; // L or R
  const pair = state.formation[side];
  return court === "L" ? pair.left : pair.right;
}

export default function Scoreboard({ settings }: { settings: MatchSettings }) {
  const need = useMemo(() => gamesNeeded(settings.bestOf), [settings.bestOf]);

  // ★ ここでモードを切り替え可能（初期は "singles"）
  const [mode, setMode] = useState<Mode>("doubles"); // ←初期からダブルスを試したい場合は "doubles"

  const [state, setState] = useState<MatchState>({
    gameIndex: 0,
    gamesWonA: 0,
    gamesWonB: 0,
    game: { a: 0, b: 0, over: false },
    matchOver: false,
    server: "A",
    serverCourt: "R",
    formation: {
      // デモ用の仮名。実装拡張で入力可能にできます
      A: { left: "A-L", right: "A-R" },
      B: { left: "B-L", right: "B-R" },
    },
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

    // サーブ権・コート・回転の更新
    let nextServer: Side;
    let nextCourt: Court;
    let nextFormation = state.formation;

    if (who === state.server) {
      // サーブ側が得点 → サーブ継続、サーバー側の点数の偶奇で L/R
      const serverPoints = who === "A" ? nextA : nextB;
      nextServer = state.server;
      nextCourt = courtFromPoints(serverPoints);

      // ★ ダブルス時のみ回転（サーブ側だけ左右スワップ）
      if (mode === "doubles") {
        nextFormation = rotateServingSide(state.formation, state.server);
      }
    } else {
      // レシーブ側が得点 → サーブ権移動、新サーバー側の点数の偶奇で L/R
      nextServer = who;
      const serverPoints = nextServer === "A" ? nextA : nextB;
      nextCourt = courtFromPoints(serverPoints);

      // ★ ダブルスでもレシーブ側得点時は回転しない（左右そのまま）
      nextFormation = state.formation;
    }

    let next: MatchState = {
      ...state,
      game: { a: nextA, b: nextB, over: judged.over, winner: judged.winner },
      server: nextServer,
      serverCourt: nextCourt,
      formation: nextFormation,
    };

    if (judged.over && judged.winner) {
      if (judged.winner === "A") next.gamesWonA += 1;
      else next.gamesWonB += 1;

      // マッチ終了判定
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

    // 次ゲーム開始サーバー＝前ゲーム勝者／開始コートは 0 点なので R
    const starter: Side = state.game.winner ?? state.server;

    setState((s) => ({
      ...s,
      gameIndex: s.gameIndex + 1,
      game: { a: 0, b: 0, over: false },
      server: starter,
      serverCourt: "R",
      // ★ 並びは前ゲーム終了時のまま（公式ルールでも固定ではないが、実運用として前の並びから開始しがち）
      formation: s.formation,
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
      formation: {
        A: { left: "A-L", right: "A-R" },
        B: { left: "B-L", right: "B-R" },
      },
    });
  };

  // 手動サーブ交代（誤操作時の救済）
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

  // 手動で左右入れ替え（誤表示の補正が必要なら）
  const swapLeftRight = (side: Side) => {
    pushHistory();
    setState({
      ...state,
      formation: rotateServingSide(state.formation, side),
    });
  };

  const a = state.game.a;
  const b = state.game.b;

  const aGamePoint =
    !state.game.over &&
    winsIfScores(a, b, "A", settings.pointsToWin, settings.cap);
  const bGamePoint =
    !state.game.over &&
    winsIfScores(a, b, "B", settings.pointsToWin, settings.cap);

  const aMatchPoint = aGamePoint && state.gamesWonA === need - 1;
  const bMatchPoint = bGamePoint && state.gamesWonB === need - 1;

  const statusLine = (() => {
    if (state.matchOver) return `マッチ終了：${state.matchWinner} 勝利`;
    if (state.game.over)
      return `ゲーム終了：${state.game.winner} がこのゲームに勝利`;
    if (isDeuce(a, b, settings.pointsToWin, settings.cap)) return "デュース";
    if (aMatchPoint && bMatchPoint) return "両者マッチポイント";
    if (aMatchPoint) return "A マッチポイント";
    if (bMatchPoint) return "B マッチポイント";
    if (aGamePoint && bGamePoint) return "両者ゲームポイント";
    if (aGamePoint) return "A ゲームポイント";
    if (bGamePoint) return "B ゲームポイント";
    return "プレー中";
  })();

  const serverName = currentServerName(state);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          Game {state.gameIndex + 1} / Best of {settings.bestOf}（先取 {need}）
        </div>

        <div className={styles.serve}>
          <span className={styles.modeSwitch}>
            <label className={styles.labelSmall}>
              Mode:&nbsp;
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className={styles.modeSelect}
                aria-label="試合モード"
              >
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
              </select>
            </label>
          </span>

          <span className={styles.serveLabel}>Serve:</span>
          <span className={styles.serveSide}>{state.server}</span>
          <span className={styles.courtBadge}>{state.serverCourt}</span>
          <span className={styles.serverName}>({serverName})</span>
        </div>
      </div>

      <div className={styles.status}>{statusLine}</div>

      <div className={styles.board}>
        {/* A side */}
        <div className={styles.card}>
          <div className={styles.sideRow}>
            <div className={styles.side}>A</div>
            {state.server === "A" && (
              <div className={styles.servePill}>
                サーブ中{" "}
                <span className={styles.courtMini}>{state.serverCourt}</span>
              </div>
            )}
          </div>

          {/* ★ A の並び表示 */}
          <div className={styles.pairRow}>
            <div className={styles.pairCell}>
              <div className={styles.pairLabel}>L</div>
              <div className={styles.pairName}>
                {safeText(state.formation.A.left, "A-L")}
                {state.server === "A" && state.serverCourt === "L" && (
                  <span className={styles.dot} />
                )}
              </div>
            </div>
            <div className={styles.pairCell}>
              <div className={styles.pairLabel}>R</div>
              <div className={styles.pairName}>
                {safeText(state.formation.A.right, "A-R")}
                {state.server === "A" && state.serverCourt === "R" && (
                  <span className={styles.dot} />
                )}
              </div>
            </div>
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

          {mode === "doubles" && (
            <button
              className={styles.smallBtn}
              onClick={() => swapLeftRight("A")}
            >
              A 左右入替（手動）
            </button>
          )}
        </div>

        {/* B side */}
        <div className={styles.card}>
          <div className={styles.sideRow}>
            <div className={styles.side}>B</div>
            {state.server === "B" && (
              <div className={styles.servePill}>
                サーブ中{" "}
                <span className={styles.courtMini}>{state.serverCourt}</span>
              </div>
            )}
          </div>

          {/* ★ B の並び表示 */}
          <div className={styles.pairRow}>
            <div className={styles.pairCell}>
              <div className={styles.pairLabel}>L</div>
              <div className={styles.pairName}>
                {safeText(state.formation.B.left, "B-L")}
                {state.server === "B" && state.serverCourt === "L" && (
                  <span className={styles.dot} />
                )}
              </div>
            </div>
            <div className={styles.pairCell}>
              <div className={styles.pairLabel}>R</div>
              <div className={styles.pairName}>
                {safeText(state.formation.B.right, "B-R")}
                {state.server === "B" && state.serverCourt === "R" && (
                  <span className={styles.dot} />
                )}
              </div>
            </div>
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

          {mode === "doubles" && (
            <button
              className={styles.smallBtn}
              onClick={() => swapLeftRight("B")}
            >
              B 左右入替（手動）
            </button>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.ctrlBtn}
          onClick={undo}
          disabled={history.length === 0}
        >
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
        <button
          className={styles.ctrlBtn}
          onClick={swapServe}
          disabled={state.matchOver}
        >
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
