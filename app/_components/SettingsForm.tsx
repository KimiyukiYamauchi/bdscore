"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/app/_components/SettingsForm.module.css";
import { usePlayers } from "../_hooks/usePlayers";

// 選手選択の select。他の枠で選択済みの選手は選べないようにする
function PlayerSelect({
  players,
  value,
  onChange,
  taken,
}: {
  players: string[];
  value: string;
  onChange: (value: string) => void;
  taken: string[];
}) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">（選択してください）</option>
      {players.map((p) => {
        const takenElsewhere = p !== value && taken.includes(p);
        return (
          <option key={p} value={p} disabled={takenElsewhere}>
            {takenElsewhere ? `${p}（選択済み）` : p}
          </option>
        );
      })}
    </select>
  );
}

export default function SettingsForm() {
  const router = useRouter();
  const { players, loaded } = usePlayers(); // ★ ここで localStorage 管理のリストを取得

  const mode = "doubles" as const; // ← 常にダブルス扱い
  const [bestOf, setBestOf] = useState<1 | 3>(1);
  const [pointsToWin, setPointsToWin] = useState<11 | 15 | 21>(15);

  // doubles 用
  const [aL, setAL] = useState("");
  const [aR, setAR] = useState("");
  const [bL, setBL] = useState("");
  const [bR, setBR] = useState("");
  const [error, setError] = useState("");

  // いずれかの枠で選択されている選手
  const taken = [aL, aR, bL, bR].filter((p) => p !== "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Set(taken).size !== taken.length) {
      setError("同じ選手が複数の枠で選択されています");
      return;
    }
    setError("");
    const params = new URLSearchParams({
      mode,
      bestOf: String(bestOf),
      pointsToWin: String(pointsToWin),
    });

    if (aL) params.set("aL", aL);
    if (aR) params.set("aR", aR);
    if (bL) params.set("bL", bL);
    if (bR) params.set("bR", bR);

    // 試合ごとの ID（リロード時に同じ試合の状態を復元するため）
    params.set("id", Date.now().toString(36));

    router.push(`/match?${params.toString()}`);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h1 className={styles.title}>試合設定</h1>

      {/* もしまだ players が読み込み中なら簡単なメッセージ */}
      {!loaded && (
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          選手リストを読み込み中です...
        </p>
      )}

      <div className={styles.row}>
        <span className={styles.label}>Mode</span>
        <span className={styles.modeFixed}>Doubles（ダブルス専用）</span>
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
          onChange={(e) =>
            setPointsToWin(Number(e.target.value) as 11 | 15 | 21)
          }
        >
          <option value={11}>11 点先取（上限 15）</option>
          <option value={15}>15 点先取（上限 21）</option>
          <option value={21}>21 点先取（上限 30）</option>
        </select>
      </div>

      {/* ★ ダブルス専用：A/Bサイドの Left / Right を選択 */}
      <div className={styles.row}>
        <b className={styles.subttl}>A サイド</b>
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Right</label>
        <PlayerSelect
          players={players}
          value={aR}
          onChange={setAR}
          taken={taken}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Left</label>
        <PlayerSelect
          players={players}
          value={aL}
          onChange={setAL}
          taken={taken}
        />
      </div>

      <div className={styles.row}>
        <b className={styles.subttl}>B サイド</b>
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Right</label>
        <PlayerSelect
          players={players}
          value={bR}
          onChange={setBR}
          taken={taken}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Left</label>
        <PlayerSelect
          players={players}
          value={bL}
          onChange={setBL}
          taken={taken}
        />
      </div>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      <button className={styles.button} type="submit">
        試合開始
      </button>

      <div style={{ marginTop: 12, textAlign: "right" }}>
        <Link href="/players" className={styles.editPlayersLink}>
          選手リストを編集する
        </Link>
      </div>
    </form>
  );
}
