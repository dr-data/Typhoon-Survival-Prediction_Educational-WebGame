import type { Difficulty } from "../shared/scoring";

export type Player = {
  nickname: string;
  anonymous: boolean;
  classCode: string;
  difficulty: Difficulty;
};

export const DEFAULT_PLAYER: Player = {
  nickname: "",
  anonymous: true,
  classCode: "",
  difficulty: "practice",
};
