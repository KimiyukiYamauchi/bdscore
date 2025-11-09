import { buildSettings } from "../_lib/parse";
import Scoreboard from "@/app/match/Scoreboard";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function MatchPage({ searchParams }: Props) {
  const sp = searchParams ?? {};
  const settings = buildSettings(sp.bestOf, sp.pointsToWin);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>バドミントン スコアボード</h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>
        Best of: {settings.bestOf}／Points to Win: {settings.pointsToWin}／Cap: {settings.cap}
      </p>
      <Scoreboard settings={settings} />
    </main>
  );
}
