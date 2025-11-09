"use client";

import { useEffect, useState } from "react";
import SettingsForm from "./_components/SettingsForm";
import QRCode from "react-qr-code";

export default function Page() {
  const [currentUrl, setCurrentUrl] = useState("");

  // 現在のURLを取得（クライアント側でのみ実行）
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.origin); // トップページURLだけを表示
    }
  }, []);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100dvh",
        padding: "40px 16px",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>
        バドミントン スコアサイト
      </h1>

      <SettingsForm />

      {/* ▼ QRコード部分 ▼ */}
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <p
          style={{
            fontSize: 14,
            color: "#4b5563",
            marginBottom: 10,
          }}
        >
          本サイトのURL（スマホでアクセス可）
        </p>

        {currentUrl ? (
          <div
            style={{
              display: "inline-block",
              padding: 16,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <QRCode value={currentUrl} size={128} />
          </div>
        ) : (
          <p>QRコードを生成中...</p>
        )}
      </div>
    </main>
  );
}
