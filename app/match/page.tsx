import { buildSettings, toMode, buildFormation } from "../_lib/parse";
import type { Formation, Mode } from "../_lib/types";
import Scoreboard from "./Scoreboard";
import styles from "./page.module.css";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function MatchPage({ searchParams }: Props) {
  const sp = searchParams ?? {};
  const settings = buildSettings(sp.bestOf, sp.pointsToWin);

  const mode: Mode = toMode(sp.mode);
  const initialFormation: Formation = buildFormation(sp as any, mode);

  return (
    <main className={styles.main}>
      {/* <h1 style={{ marginBottom: 12 }}>バドミントン スコアボード</h1> */}
      <p className={styles.infoText}>
        Mode: {mode} ／ Best of: {settings.bestOf} ／ Points to Win:{" "}
        {settings.pointsToWin} ／ Cap: {settings.cap}
      </p>
      <Scoreboard
        settings={settings}
        defaultMode={mode}
        defaultFormation={initialFormation}
      />
    </main>
  );
}
