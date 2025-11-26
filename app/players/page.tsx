// app/players/page.tsx
"use client";

import { useState } from "react";
import { usePlayers } from "../_hooks/usePlayers";
import Link from "next/link";
import styles from "./PlayersPage.module.css";

export default function PlayersPage() {
  const {
    players,
    loaded,
    addPlayer,
    updatePlayer,
    removePlayer,
    resetToDefault,
  } = usePlayers();

  const [newName, setNewName] = useState("");

  if (!loaded) {
    return <main style={{ padding: 24 }}>読み込み中...</main>;
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>選手リストの編集</h1>
      <p className={styles.description}>
        ここで追加・削除・名前変更した選手は、ローカルブラウザ（localStorage）に保存され、
        試合設定画面（トップページ）の選手選択に使われます。
      </p>

      {/* 追加フォーム */}
      <section className={`${styles.section} ${styles.sectionAdd}`}>
        <h2 className={styles.sectionTitle}>選手を追加</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addPlayer(newName);
            setNewName("");
          }}
          className={styles.form}
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="例）山内 公之"
            className={styles.formInput}
          />
          <button type="submit" className={styles.formButton}>
            追加
          </button>
        </form>
      </section>

      {/* リスト編集 */}
      <section className={`${styles.section} ${styles.sectionList}`}>
        <h2 className={styles.sectionListTitle}>登録済みの選手</h2>

        {players.length === 0 ? (
          <p className={styles.emptyMessage}>まだ選手が登録されていません。</p>
        ) : (
          <ul className={styles.playerList}>
            {players.map((p, i) => (
              <li key={i} className={styles.playerItem}>
                <input
                  type="text"
                  value={p}
                  onChange={(e) => updatePlayer(i, e.target.value)}
                  className={styles.playerInput}
                />
                <button
                  type="button"
                  onClick={() => removePlayer(i)}
                  className={styles.deleteButton}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            onClick={resetToDefault}
            className={styles.resetButton}
          >
            デフォルトに戻す
          </button>
          <Link href="/" className={styles.backLink}>
            試合設定画面へ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
