// app/players/page.tsx
"use client";

import { useState } from "react";
import { usePlayers } from "../_hooks/usePlayers";
import Link from "next/link";

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
    <main style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>選手リストの編集</h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
        ここで追加・削除・名前変更した選手は、ローカルブラウザ（localStorage）に保存され、
        試合設定画面（トップページ）の選手選択に使われます。
      </p>

      {/* 追加フォーム */}
      <section
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>選手を追加</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addPlayer(newName);
            setNewName("");
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="例）山内 公之"
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            追加
          </button>
        </form>
      </section>

      {/* リスト編集 */}
      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>登録済みの選手</h2>

        {players.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            まだ選手が登録されていません。
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {players.map((p, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <input
                  type="text"
                  value={p}
                  onChange={(e) => updatePlayer(i, e.target.value)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => removePlayer(i)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 12,
                    background: "#ef4444",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={resetToDefault}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 12,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            デフォルトに戻す
          </button>
          <Link
            href="/"
            style={{
              fontSize: 13,
              textDecoration: "underline",
              color: "#2563eb",
              alignSelf: "center",
            }}
          >
            試合設定画面へ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
