import { buildSettings } from "../_lib/parse";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function MatchPage({ searchParams }: Props) {
  const sp = searchParams ?? {};
  const settings = buildSettings(sp.bestOf, sp.pointsToWin);

  return (
    <main style={{ padding: 24 }}>
      <h1>スコアボード（デモ）</h1>
      <p>Best of: {settings.bestOf}</p>
      <p>Points to Win: {settings.pointsToWin}</p>
      <p>Cap（上限）: {settings.cap}</p>

      {/* ここに実際のスコアボードUIやロジック（useReducer 等）を組み込み */}
    </main>
  );
}
