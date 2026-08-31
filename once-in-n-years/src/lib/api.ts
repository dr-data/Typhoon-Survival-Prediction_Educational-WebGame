import type { Difficulty } from "../../shared/scoring";
import type { StudentAnswer } from "../../shared/questions/types";

export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  anonymous: boolean;
  classCode: string | null;
  difficulty: string;
  score: number;
  correct: number;
  questionCount: number;
  bestStreak: number;
  durationMs: number;
  createdAt: number;
};

export async function fetchLeaderboard(classCode: string, difficulty: string) {
  const params = new URLSearchParams();
  if (classCode) params.set("classCode", classCode);
  if (difficulty) params.set("difficulty", difficulty);
  const res = await fetch(`/api/leaderboard?${params.toString()}`);
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    classCode?: string | null;
    entries?: LeaderboardEntry[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not load the leaderboard.");
  }
  return { classCode: data.classCode ?? null, entries: data.entries ?? [] };
}

export async function submitRun(input: {
  seed: number;
  difficulty: Difficulty;
  nickname: string;
  anonymous: boolean;
  classCode: string;
  answers: StudentAnswer[];
  turnstileToken?: string;
}) {
  const res = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { error?: string; score?: number; nickname?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not save your score.");
  }
  return data;
}
