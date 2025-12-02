"use client";

import styles from "@/app/match/Scoreboard.module.css";
import React from "react";

type Side = "A" | "B";
type Court = "L" | "R";
type Pair = { left: string; right: string };

type Props = {
  pair: Pair;
  team: Side;
  viewSide: "left" | "right";
  server: Side;
  serverCourt: Court;
};

const safeText = (s: string | undefined, fallback: string) =>
  s && s.trim().length > 0 ? s : fallback;

export default function PairDisplay({
  pair,
  team,
  viewSide,
  server,
  serverCourt,
}: Props) {
  const topCourt: Court = viewSide === "left" ? "L" : "R";
  const bottomCourt: Court = viewSide === "left" ? "R" : "L";

  const topLabel = topCourt;
  const bottomLabel = bottomCourt;

  const topName =
    topCourt === "L"
      ? safeText(pair.left, `${team}-L`)
      : safeText(pair.right, `${team}-R`);
  const bottomName =
    bottomCourt === "L"
      ? safeText(pair.left, `${team}-L`)
      : safeText(pair.right, `${team}-R`);

  return (
    <div className={styles.pairRow}>
      <div className={styles.pairCell}>
        <div className={styles.pairLabel}>{topLabel}</div>
        <div className={styles.pairName}>
          {topName}
          {server === team && serverCourt === topCourt && (
            <span className={styles.dot} />
          )}
        </div>
      </div>

      <div className={styles.pairCell}>
        <div className={styles.pairLabel}>{bottomLabel}</div>
        <div className={styles.pairName}>
          {bottomName}
          {server === team && serverCourt === bottomCourt && (
            <span className={styles.dot} />
          )}
        </div>
      </div>
    </div>
  );
}
