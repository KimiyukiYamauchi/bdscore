"use client";

import { useEffect, useState } from "react";
import { buildSettings } from "../_lib/parse";
import Scoreboard from "./Scoreboard";
import QRCode from "react-qr-code"; // ← 追加

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function MatchPage({ searchParams }: Props) {
  const sp = searchParams ?? {};
  const settings = buildSettings(sp.bestOf, sp.pointsToWin);

  const [currentUrl, setCurrentUrl] = useState("");

  // クライアント側でURL取得
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  return (
    <main style={{ padding: 24, textAlign: "center" }}>
      <h1 style={{ marginBottom: 12 }}>バドミントン スコアボード</h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>
        Best of: {settings.bestOf} ／ Points to Win: {settings.pointsToWin} ／
        Cap: {settings.cap}
      </p>

      <div style={{ display: "inline-block", textAlign: "left" }}>
        <Scoreboard settings={settings} />
      </div>

      {/* ▼ QRコード表示部分 ▼ */}
      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 10 }}>
          本サイトのURL（スマホでアクセス可）
        </p>
        {currentUrl && (
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
        )}
        {!currentUrl && <p>QRコードを生成中...</p>}
      </div>
    </main>
  );
}
