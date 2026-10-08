"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import styles from "@/app/match/Scoreboard.module.css";
import Link from "next/link";
import ScoreCard from "@/app/_components/ScoreCard";
import type {
  Formation,
  MatchSettings,
  MatchState,
  Mode,
  Side,
} from "@/app/_lib/types";
import {
  addPoint as applyPoint,
  currentServerName,
  gamesNeeded,
  initialMatchState,
  isDeuce,
  isMatchPoint,
  resetMatch as applyReset,
  startNextGame,
  swapPair,
  swapServe as applySwapServe,
  winsIfScores,
} from "@/app/_lib/rules";

const MATCH_STORAGE_KEY = "badmintonMatch";

type StoredMatch = {
  id: string;
  state: MatchState;
  history: MatchState[];
};

const DEFAULT_FORMATION: Formation = {
  A: { left: "A-L", right: "A-R" },
  B: { left: "B-L", right: "B-R" },
};

type Props = {
  settings: MatchSettings;
  defaultFormation?: Formation;
  // 試合ごとの ID。同じ ID で開き直した時だけ保存済みの状態を復元する
  matchId?: string;
};

export default function Scoreboard({
  settings,
  defaultFormation,
  matchId,
}: Props) {
  const need = useMemo(() => gamesNeeded(settings.bestOf), [settings.bestOf]);

  const mode: Mode = "doubles"; // ← 常にダブルス扱い

  const [state, setState] = useState<MatchState>(() =>
    initialMatchState(defaultFormation ?? DEFAULT_FORMATION),
  );
  const [history, setHistory] = useState<MatchState[]>([]);
  const [restored, setRestored] = useState(false);

  // リロード時などに localStorage から試合状態を復元
  useEffect(() => {
    if (matchId) {
      try {
        const raw = window.localStorage.getItem(MATCH_STORAGE_KEY);
        const saved = raw ? (JSON.parse(raw) as StoredMatch) : null;
        if (saved && saved.id === matchId) {
          // 古い保存データには flipped が無いので補う
          setState({ ...saved.state, flipped: saved.state.flipped ?? false });
          setHistory(
            saved.history.map((h) => ({ ...h, flipped: h.flipped ?? false })),
          );
        }
      } catch (e) {
        console.warn("failed to restore match from localStorage", e);
      }
    }
    setRestored(true);
  }, [matchId]);

  // 状態が変わるたびに保存（復元が終わる前に初期状態で上書きしない）
  useEffect(() => {
    if (!restored || !matchId) return;
    try {
      const data: StoredMatch = { id: matchId, state, history };
      window.localStorage.setItem(MATCH_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("failed to save match to localStorage", e);
    }
  }, [restored, matchId, state, history]);

  // 状態を更新し、変化があれば直前の状態を履歴に積む
  const apply = (fn: (s: MatchState) => MatchState) => {
    const next = fn(state);
    if (next === state) return;
    setHistory((h) => [...h, state]);
    setState(next);
  };

  const undo = () => {
    if (history.length === 0) return;
    setState(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  };

  const addPoint = (who: Side) => apply((s) => applyPoint(s, who, settings));
  const nextGame = () => apply(startNextGame);
  const resetMatch = () => {
    if (!window.confirm("マッチをリセットしますか？")) return;
    apply(applyReset);
  };
  // 手動サーブ交代（誤操作時の救済）
  const swapServe = () => apply(applySwapServe);
  // 手動で左右入れ替え（誤表示の補正が必要なら）
  const swapLeftRight = (side: Side) =>
    apply((s) => ({ ...s, formation: swapPair(s.formation, side) }));
  // 画面の左右に表示するチームを入れ替え
  const flipSides = () => apply((s) => ({ ...s, flipped: !s.flipped }));

  const a = state.game.a;
  const b = state.game.b;

  const aGamePoint =
    !state.game.over &&
    winsIfScores(a, b, "A", settings.pointsToWin, settings.cap);

  const bGamePoint =
    !state.game.over &&
    winsIfScores(a, b, "B", settings.pointsToWin, settings.cap);

  const aMatchPoint = isMatchPoint(state, "A", settings);
  const bMatchPoint = isMatchPoint(state, "B", settings);

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
    // 保存済み状態の復元が終わるまでは判定しない
    if (!restored) return;

    const prev = prevStatusRef.current;
    const current = statusLine;

    // まったく同じなら何もしない
    if (prev === current) {
      return;
    }

    // 初回（復元直後を含む）は基準を覚えるだけで、ポップアップは出さない
    if (prev === null) {
      prevStatusRef.current = current;
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
  }, [restored, statusLine]);

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
  const leftTeam: Side = state.flipped ? "B" : "A";
  const rightTeam: Side = state.flipped ? "A" : "B";

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
          onClick={flipSides}
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
