// app/_hooks/usePlayers.ts
"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PLAYERS, PLAYERS_STORAGE_KEY } from "../_lib/players";

export function usePlayers() {
  const [players, setPlayers] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 初回マウント時に localStorage から読み込み
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // 以前のバージョンで登録された重複は取り除く
          const names = parsed.filter((p): p is string => typeof p === "string");
          setPlayers(Array.from(new Set(names)));
          setLoaded(true);
          return;
        }
      } catch (e) {
        console.warn("failed to parse players from localStorage", e);
      }
    }

    // localStorage にまだ何もない場合は DEFAULT_PLAYERS を使う
    setPlayers(DEFAULT_PLAYERS);
    setLoaded(true);
  }, []);

  const save = (list: string[]) => {
    setPlayers(list);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(list));
    }
  };

  // 同じ名前がすでに登録されていれば false を返して追加しない
  const addPlayer = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed || players.includes(trimmed)) return false;
    save([...players, trimmed]);
    return true;
  };

  // 他の選手と同じ名前になる場合は false を返して変更しない
  const updatePlayer = (index: number, name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (players.some((p, i) => i !== index && p === trimmed)) return false;
    const next = [...players];
    next[index] = trimmed;
    save(next);
    return true;
  };

  const removePlayer = (index: number) => {
    const next = players.filter((_, i) => i !== index);
    save(next);
  };

  const resetToDefault = () => {
    save(DEFAULT_PLAYERS);
  };

  return {
    players,
    loaded,
    addPlayer,
    updatePlayer,
    removePlayer,
    resetToDefault,
  };
}
