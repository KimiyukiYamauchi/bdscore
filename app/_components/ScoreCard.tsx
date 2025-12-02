"use client";

import React from "react";
import styles from "@/app/match/Scoreboard.module.css";
import PairDisplay from "./PairDisplay";

type Side = "A" | "B";
type Court = "L" | "R";
type Pair = { left: string; right: string };
type Mode = "singles" | "doubles";

type Props = {
  team: Side;
  server: Side;
  serverCourt: Court;
  pair: Pair;
  viewSide: "left" | "right";
  score: number;
  games: number;
  onAddPoint: (team: Side) => void;
  onSwapLeftRight: (side: Side) => void;
  mode: Mode;
  disabled?: boolean;
};

export default function ScoreCard({
  team,
  server,
  serverCourt,
  pair,
  viewSide,
  score,
  games,
  onAddPoint,
  onSwapLeftRight,
  mode,
  disabled,
}: Props) {
  const isServing = server === team;

  return (
    <div className={`${styles.card} ${isServing ? styles.servingCard : ""}`}>
      <div className={styles.sideRow}>
        <div className={styles.side}>{team}</div>
        {isServing && (
          <div className={styles.servePill}>
            サーブ中 <span className={styles.courtMini}>{serverCourt}</span>
          </div>
        )}
      </div>

      <PairDisplay
        pair={pair}
        team={team}
        viewSide={viewSide}
        server={server}
        serverCourt={serverCourt}
      />

      <div className={styles.score}>{score}</div>
      <button
        className={styles.pointBtn}
        onClick={() => onAddPoint(team)}
        disabled={disabled}
        aria-label={`${team}に1点加算`}
      >
        {team} +1
      </button>
      <div className={styles.games}>Games: {games}</div>

      {mode === "doubles" && (
        <button
          className={styles.smallBtn}
          onClick={() => onSwapLeftRight(team)}
        >
          {team} 左右入替（手動）
        </button>
      )}
    </div>
  );
}
