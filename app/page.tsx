"use client";

import { useEffect, useState } from "react";
import SettingsForm from "./_components/SettingsForm";
import QRCode from "react-qr-code";
import styles from "./page.module.css";

export default function Page() {
  const [currentUrl, setCurrentUrl] = useState("");

  // 現在のURLを取得（クライアント側でのみ実行）
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.origin); // トップページURLだけを表示
    }
  }, []);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>バドミントン スコアサイト</h1>

      <SettingsForm />

      {/* ▼ QRコード部分 ▼ */}
      <div className={styles.qrSection}>
        <p className={styles.qrText}>本サイトのURL（スマホでアクセス可）</p>

        {currentUrl ? (
          <div className={styles.qrBox}>
            <QRCode value={currentUrl} size={128} />
          </div>
        ) : (
          <p>QRコードを生成中...</p>
        )}
      </div>
    </main>
  );
}
