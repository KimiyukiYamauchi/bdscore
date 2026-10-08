// app/players/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePlayers } from "../_hooks/usePlayers";
import Link from "next/link";
import styles from "./PlayersPage.module.css";

// 入力中は下書きとして保持し、フォーカスが外れた時（または Enter）に確定する。
// 1文字ごとに trim して保存するとスペースが打てない・全消しできないため。
function PlayerNameInput({
  name,
  onCommit,
}: {
  name: string;
  onCommit: (name: string) => void;
}) {
  const [draft, setDraft] = useState(name);

  // 削除やリセットで外側の値が変わったら追従する
  useEffect(() => {
    setDraft(name);
  }, [name]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      // 空のまま確定しようとしたら元の名前に戻す
      setDraft(name);
      return;
    }
    if (trimmed !== name) onCommit(trimmed);
    setDraft(trimmed);
  };

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={styles.playerInput}
    />
  );
}

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
                <PlayerNameInput
                  name={p}
                  onCommit={(name) => updatePlayer(i, name)}
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
