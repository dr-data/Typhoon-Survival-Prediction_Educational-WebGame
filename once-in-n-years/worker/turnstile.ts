import type { Env } from "./env";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstile(
  env: Env,
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) {
    return true;
  }
  if (!token) return false;
  const body = new URLSearchParams();
  body.set("secret", env.TURNSTILE_SECRET);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = (await res.json()) as TurnstileResponse;
  return data.success === true;
}
