"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/_components/SettingsForm.module.css";
import { PLAYERS } from "../_lib/players";

export default function SettingsForm() {
  const router = useRouter();

  const [mode, setMode] = useState<"singles" | "doubles">("doubles");
  const [bestOf, setBestOf] = useState<1 | 3>(1);
  const [pointsToWin, setPointsToWin] = useState<15 | 21>(15);

  // singles 用
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  // doubles 用
  const [aL, setAL] = useState("");
  const [aR, setAR] = useState("");
  const [bL, setBL] = useState("");
  const [bR, setBR] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      mode,
      bestOf: String(bestOf),
      pointsToWin: String(pointsToWin),
    });

    if (mode === "singles") {
      if (a) params.set("a", a);
      if (b) params.set("b", b);
    } else {
      if (aL) params.set("aL", aL);
      if (aR) params.set("aR", aR);
      if (bL) params.set("bL", bL);
      if (bR) params.set("bR", bR);
    }

    router.push(`/match?${params.toString()}`);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h1 className={styles.title}>試合設定</h1>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="mode">
          Mode
        </label>
        <select
          id="mode"
          className={styles.select}
          value={mode}
          onChange={(e) => setMode(e.target.value as "singles" | "doubles")}
        >
          <option value="singles">Singles</option>
          <option value="doubles">Doubles</option>
        </select>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="bestOf">
          Best of
        </label>
        <select
          id="bestOf"
          className={styles.select}
          value={bestOf}
          onChange={(e) => setBestOf(Number(e.target.value) as 1 | 3)}
        >
          <option value={1}>1（1ゲームマッチ）</option>
          <option value={3}>3（3ゲームマッチ）</option>
        </select>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="pointsToWin">
          Points to Win
        </label>
        <select
          id="pointsToWin"
          className={styles.select}
          value={pointsToWin}
          onChange={(e) => setPointsToWin(Number(e.target.value) as 15 | 21)}
        >
          <option value={15}>15 点先取（上限 21）</option>
          <option value={21}>21 点先取（上限 30）</option>
        </select>
      </div>

      {/* 選手選択：モードで切替 */}
      {mode === "singles" ? (
        <>
          <div className={styles.row}>
            <label className={styles.label}>A 選手</label>
            <select
              className={styles.select}
              value={a}
              onChange={(e) => setA(e.target.value)}
            >
              <option value="">（選択してください）</option>
              {PLAYERS.map((p) => (
                <option key={`a-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>B 選手</label>
            <select
              className={styles.select}
              value={b}
              onChange={(e) => setB(e.target.value)}
            >
              <option value="">（選択してください）</option>
              {PLAYERS.map((p) => (
                <option key={`b-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          <div className={styles.row}>
            <b className={styles.subttl}>A サイド</b>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Left</label>
            <select
              className={styles.select}
              value={aL}
              onChange={(e) => setAL(e.target.value)}
            >
              <option value="">（選択してください）</option>
              {PLAYERS.map((p) => (
                <option key={`al-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Right</label>
            <select
              className={styles.select}
              value={aR}
              onChange={(e) => setAR(e.target.value)}
            >
              <option value="">（選択してください）</option>
              {PLAYERS.map((p) => (
                <option key={`ar-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <b className={styles.subttl}>B サイド</b>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Left</label>
            <select
              className={styles.select}
              value={bL}
              onChange={(e) => setBL(e.target.value)}
            >
              <option value="">（選択してください）</option>
              {PLAYERS.map((p) => (
                <option key={`bl-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Right</label>
            <select
              className={styles.select}
              value={bR}
              onChange={(e) => setBR(e.target.value)}
            >
              <option value="">（選択してください）</option>
              {PLAYERS.map((p) => (
                <option key={`br-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <button className={styles.button} type="submit">
        試合開始
      </button>
    </form>
  );
}
