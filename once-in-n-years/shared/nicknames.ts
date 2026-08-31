const BLOCKLIST = [
  "admin",
  "nigger",
  "nigga",
  "faggot",
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "rape",
  "slut",
  "whore",
  "porn",
  "sex",
  "nazi",
  "hitler",
];

const NICKNAME_PATTERN = /^[\p{L}\p{N} _.'-]{2,24}$/u;

export type NicknameResult =
  | { ok: true; nickname: string; anonymous: boolean }
  | { ok: false; error: string };

export function normaliseClassCode(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  if (!/^[A-Z0-9-]{3,12}$/.test(code)) {
    throw new Error("Class or tutorial codes use 3–12 letters, numbers, or hyphens.");
  }
  return code;
}

export function sanitiseNickname(raw: string, anonymous: boolean): NicknameResult {
  if (anonymous) {
    return { ok: true, nickname: anonymousNickname(), anonymous: true };
  }
  const nickname = raw.trim().replace(/\s+/g, " ");
  if (nickname.length < 2) {
    return { ok: false, error: "Please choose a nickname of at least 2 characters, or play anonymously." };
  }
  if (nickname.length > 24) {
    return { ok: false, error: "Nicknames can be at most 24 characters." };
  }
  if (!NICKNAME_PATTERN.test(nickname)) {
    return {
      ok: false,
      error: "Nicknames may use letters, numbers, spaces, hyphens, apostrophes, and dots only.",
    };
  }
  const haystack = nickname.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (BLOCKLIST.some((word) => haystack.includes(word))) {
    return { ok: false, error: "Please pick another nickname. This one is not allowed." };
  }
  return { ok: true, nickname, anonymous: false };
}

export function anonymousNickname(rng: () => number = Math.random): string {
  const prefixes = ["Storm", "Rain", "Tide", "Mist", "Gale", "Drift", "Cloud", "Harbour"];
  const prefix = prefixes[Math.floor(rng() * prefixes.length)] ?? "Storm";
  const n = Math.floor(rng() * 9000) + 1000;
  return `${prefix}-${n}`;
}
