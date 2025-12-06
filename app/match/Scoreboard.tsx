"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import styles from "@/app/match/Scoreboard.module.css";
import Link from "next/link";
import ScoreCard from "@/app/_components/ScoreCard";

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

type Props = {
  settings: MatchSettings;
  defaultFormation?: {
    A: { left: string; right: string };
    B: { left: string; right: string };
  };
};

export default function Scoreboard({ settings, defaultFormation }: Props) {
  const need = useMemo(() => gamesNeeded(settings.bestOf), [settings.bestOf]);

  const mode: Mode = "doubles"; // ← 常にダブルス扱い
  const [flipped, setFlipped] = useState(false); // ★ 追加：左右入れ替えフラグ

  const [state, setState] = useState<MatchState>({
    gameIndex: 0,
    gamesWonA: 0,
    gamesWonB: 0,
    game: { a: 0, b: 0, over: false },
    matchOver: false,
    server: "A",
    serverCourt: "R",
    formation: defaultFormation ?? {
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
    setState((s) => ({
      ...s, // ★ 既存の formation / mode / 名前はそのまま残す
      gameIndex: 0,
      gamesWonA: 0,
      gamesWonB: 0,
      game: { a: 0, b: 0, over: false },
      matchOver: false,
      matchWinner: undefined,
      server: "A",
      serverCourt: "R",
      // formation: s.formation   ← 書かなくてOK（...s に含まれている）
    }));
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
    const f = deepClone(state.formation);
    const p = f[side];
    f[side] = { left: p.right, right: p.left };
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

  // ★ このポイントを取ったら「ゲームも取り、かつマッチが終わるか？」で判定
  const isMatchPoint = (who: Side): boolean => {
    if (state.matchOver || state.game.over) return false;

    // そもそもこの1点でゲームが終わらないならマッチポイントではない
    const willWinGame = winsIfScores(
      a,
      b,
      who,
      settings.pointsToWin,
      settings.cap
    );
    if (!willWinGame) return false;

    // このゲームを取ったあとのゲーム数をシミュレーション
    const nextGamesWonA = state.gamesWonA + (who === "A" ? 1 : 0);
    const nextGamesWonB = state.gamesWonB + (who === "B" ? 1 : 0);

    // その時点で必要ゲーム数(need)に到達していればマッチ終了
    return nextGamesWonA >= need || nextGamesWonB >= need;
  };

  const aMatchPoint = isMatchPoint("A");
  const bMatchPoint = isMatchPoint("B");

  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const getWinnerTeamLabel = () => {
    if (!state.matchWinner) return "";

    const winnerSide = state.matchWinner; // "A" または "B"
    const pair = state.formation[winnerSide]; // Pair型 { left: string; right: string }

    const leftName = pair.left;
    const rightName = pair.right;

    return `${leftName}＆${rightName}チーム勝利！`;
  };

  const statusLine = (() => {
    if (state.matchOver) {
      // ★ マッチ終了時だけ選手名を使った表記にする
      return getWinnerTeamLabel();
    }

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

  useEffect(() => {
    const prev = prevStatusRef.current;
    const current = statusLine;

    // まったく同じなら何もしない
    if (prev === current) {
      return;
    }

    // --- ここから「前には無かったのに今は含まれているか？」をチェック ---

    // マッチ終了
    if (!prev?.includes("チーム勝利！") && current.includes("チーム勝利！")) {
      setPopupMessage(current); // 「きゃん＆よこたチーム勝利！」などそのまま表示
    }
    // ゲーム終了（マッチ終了で return しないよう else にしない）
    if (!prev?.includes("ゲーム終了") && current.includes("ゲーム終了")) {
      setPopupMessage(current); // 「ゲーム終了：A がこのゲームに勝利」
    }
    // マッチポイント（A/B/両者 まとめて）
    if (
      !prev?.includes("マッチポイント") &&
      current.includes("マッチポイント")
    ) {
      setPopupMessage(current); // 「A マッチポイント」など
    }
    // デュース
    if (!prev?.includes("デュース") && current.includes("デュース")) {
      setPopupMessage("デュースになりました！");
    }
    // ゲームポイント
    if (
      !prev?.includes("ゲームポイント") &&
      current.includes("ゲームポイント")
    ) {
      setPopupMessage(current);
    }

    // 最後に現在値を覚えておく
    prevStatusRef.current = current;
  }, [statusLine]);

  // useEffect(() => {
  //   if (!popupMessage) return;

  //   // ★ 「チーム勝利！」のときは自動で閉じない
  //   if (popupMessage.includes("チーム勝利！")) {
  //     return;
  //   }

  //   const timer = setTimeout(() => {
  //     setPopupMessage(null);
  //   }, 2000); // 2秒後に閉じる

  //   return () => clearTimeout(timer);
  // }, [popupMessage]);

  const serverName = currentServerName(state);

  // ★ ここがポイント：画面左・右にどのチームを出すかだけ flipped で切り替え
  const leftTeam: Side = flipped ? "B" : "A";
  const rightTeam: Side = flipped ? "A" : "B";

  const scoreOf = (team: Side) => (team === "A" ? a : b);
  const gamesOf = (team: Side) =>
    team === "A" ? state.gamesWonA : state.gamesWonB;

  // Pair display and side card are moved to components

  const isWinPopup = popupMessage?.includes("チーム勝利！");

  const isLeftWinner = state.matchOver && state.matchWinner === leftTeam;
  const isRightWinner = state.matchOver && state.matchWinner === rightTeam;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          Game {state.gameIndex + 1} / Best of {settings.bestOf}（先取 {need}）
        </div>

        <div className={styles.serve}>
          <span className={styles.modeSwitch}>
            <span className={styles.labelSmall}>Mode: Doubles</span>
          </span>

          <span className={styles.serveLabel}>Serve:</span>
          <span className={styles.serveSide}>{state.server}</span>
          <span className={styles.courtBadge}>{state.serverCourt}</span>
          <span className={styles.serverName}>({serverName})</span>
        </div>
      </div>

      <div className={styles.status}>{statusLine}</div>

      {/* ★ 追加：ポップアップ */}
      {/* ★ 勝利時だけトロフィー＋花吹雪を出す */}
      {popupMessage && (
        <div className={styles.popupBackdrop}>
          <div
            className={`${styles.popup} ${isWinPopup ? styles.popupWin : ""}`}
          >
            {/* 勝利時だけトロフィー＆花吹雪 */}
            {isWinPopup && (
              <>
                <div className={styles.trophy}>🏆</div>

                <div className={styles.confetti}>
                  {/* 紙吹雪パーツをいくつか並べる */}
                  <span className={styles.confettiPiece} />
                  <span className={styles.confettiPiece} />
                  <span className={styles.confettiPiece} />
                  <span className={styles.confettiPiece} />
                  <span className={styles.confettiPiece} />
                  <span className={styles.confettiPiece} />
                  <span className={styles.confettiPiece} />
                  <span className={styles.confettiPiece} />
                </div>
              </>
            )}

            <p className={styles.message}>{popupMessage}</p>

            <button
              className={styles.popupButton}
              onClick={() => setPopupMessage(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* boardFlipped は使わず、leftTeam/rightTeam で左右を切替 */}
      <div className={styles.board}>
        {/* 左サイド */}
        <div
          className={`${styles.side} ${isLeftWinner ? styles.sideWinner : ""}`}
        >
          <ScoreCard
            team={leftTeam}
            server={state.server}
            serverCourt={state.serverCourt}
            pair={state.formation[leftTeam]}
            viewSide="left"
            score={scoreOf(leftTeam)}
            games={gamesOf(leftTeam)}
            onAddPoint={() => addPoint(leftTeam)}
            onSwapLeftRight={(t) => swapLeftRight(t)}
            mode={mode}
            disabled={state.game.over || state.matchOver}
          />
        </div>
        {/* 右サイド */}
        <div
          className={`${styles.side} ${isRightWinner ? styles.sideWinner : ""}`}
        >
          <ScoreCard
            team={rightTeam}
            server={state.server}
            serverCourt={state.serverCourt}
            pair={state.formation[rightTeam]}
            viewSide="right"
            score={scoreOf(rightTeam)}
            games={gamesOf(rightTeam)}
            onAddPoint={() => addPoint(rightTeam)}
            onSwapLeftRight={(t) => swapLeftRight(t)}
            mode={mode}
            disabled={state.game.over || state.matchOver}
          />
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

        {/* ★ 追加：左右入れ替え */}
        <button
          className={styles.ctrlBtn}
          type="button"
          onClick={() => {
            pushHistory();
            setFlipped((v) => !v);
          }}
        >
          サイド入れ替え
        </button>

        <button className={styles.dangerBtn} onClick={resetMatch}>
          マッチをリセット
        </button>
      </div>

      <div className={styles.meta}>
        <span>Points to Win: {settings.pointsToWin}</span>
        <span>Cap: {settings.cap}</span>
      </div>

      <Link href="/" className={styles.backLink}>
        トップページへ戻る
      </Link>
    </div>
  );
}
