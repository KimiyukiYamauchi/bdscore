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
          setPlayers(parsed.filter((p) => typeof p === "string"));
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

  const addPlayer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // 重複を避けたい場合はフィルタリング
    save([...players, trimmed]);
  };

  const updatePlayer = (index: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [...players];
    next[index] = trimmed;
    save(next);
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
