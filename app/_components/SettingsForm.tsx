"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/_components/SettingsForm.module.css";

export default function SettingsForm() {
  const router = useRouter();
  const [bestOf, setBestOf] = useState<1 | 3>(3);
  const [pointsToWin, setPointsToWin] = useState<15 | 21>(21);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // URL クエリで /match に引き渡す
    const params = new URLSearchParams({
      bestOf: String(bestOf),
      pointsToWin: String(pointsToWin),
    });
    router.push(`/match?${params.toString()}`);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h1 className={styles.title}>試合設定</h1>

      <div className={styles.row}>
        <label htmlFor="bestOf" className={styles.label}>Best of</label>
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
        <label htmlFor="pointsToWin" className={styles.label}>Points to Win</label>
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

      <button className={styles.button} type="submit">試合開始</button>
    </form>
  );
}
