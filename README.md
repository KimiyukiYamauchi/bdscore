# 🏸 Badminton Score App

**Next.js + TypeScript + CSS Modules** で作成した、  
バドミントンの公式ルールに沿ったスコア管理 Web アプリです。

---

## 🚀 実行環境

- **Vercel**  
  https://bdscore.vercel.app/

---

## ✨ 主な特徴

### ✔️ 公式ルール準拠のスコア計算

- 21 点制（cap 30）
- 15 点制（cap 21）
- デュース処理
- ゲームポイント / マッチポイント判定
- Best of 1 / 3 対応

### ✔️ ダブルスの“回転”を自動再現

- サーブ側が得点すると左右が入れ替わる “回転”
- サーブ権の移動にも正しく対応

### ✔️ コートチェンジ（サイド入れ替え）

- 左右表示を反転するだけで、試合状態は保持
- 実際のスコアラー視点に合わせて調整可能

### ✔️ 選手リスト編集（localStorage）

- 選手の追加・削除・更新が可能
- localStorage に保存されるため入力の手間が省ける

### ✔️ スマホ最適化

- iPhone / Android に対応
- UI の崩れ・select のはみ出しなどを改善済

---

## 📦 インストール

```bash
git clone https://github.com/KimiyukiYamauchi/bdscore.git
cd bdscore
npm install
npm run dev
```

## 📁 ディレクトリ構造

```python
.
├── README.md # 本ファイル
├── README2.md # 元のnextのプロジェクトを作成した際についていたREADME.mdをリネームした
├── app
│ ├── _components
│ │ ├── PairDisplay.tsx # ペア表示（L/R 2段表示）
│ │ ├── ScoreCard.tsx # 各サイドのカード表示
│ │ ├── SettingsForm.module.css # 設定フォームのスタイル
│ │ └── SettingsForm.tsx # 試合設定フォーム
│ │
│ ├── _hooks
│ │ └── usePlayers.ts # localStorage を利用した選手管理
│ │
│ ├── _lib
│ │ ├── parse.ts # 試合設定のパース・ルール関連
│ │ ├── players.ts # 初期選手データ
│ │ └── types.ts # 型定義
│ │
│ ├── favicon.ico
│ ├── globals.css
│ ├── layout.tsx # アプリ全体のレイアウト
│ │
│ ├── match
│ │ ├── Scoreboard.module.css # スコアボードのスタイル
│ │ ├── Scoreboard.tsx # スコアボード本体（ロジック & UI）
│ │ ├── page.module.css
│ │ └── page.tsx # スコアページ
│ │
│ ├── page.module.css # トップ画面のスタイル
│ ├── page.tsx # トップ画面：試合設定ページ
│ │
│ └── players
│ ├── PlayersPage.module.css
│ └── page.tsx # 選手リスト編集ページ
│
├── public
│
├── .eslintrc.json
├── .gitignore
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
└── tsconfig.json
```

## 🙌 作者

山内 公之（Kimiyuki Yamauchi）  
IT カレッジ沖縄 非常勤講師
