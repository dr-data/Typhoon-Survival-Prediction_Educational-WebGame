import type { Env } from "./env";

const ALLOWED_MODELS = ["@cf/meta/llama-3.1-8b-instruct"] as const;

export async function maybeRewriteExplanation(
  env: Env,
  explanation: string,
  requiredTokens: string[],
): Promise<{ text: string; source: "template" | "ai" }> {
  if (!env.AI) {
    return { text: explanation, source: "template" };
  }
  try {
    const result = await env.AI.run(ALLOWED_MODELS[0], {
      messages: [
        {
          role: "system",
          content:
            "You rewrite educational feedback for non-science university students. Do not invent numbers, formulas, or probabilities. Use only the facts in the user message. Keep it under 80 words. Plain language.",
        },
        {
          role: "user",
          content: explanation,
        },
      ],
      max_tokens: 160,
    });
    const text =
      typeof result === "object" && result && "response" in result
        ? String((result as { response: string }).response)
        : "";
    const ok = requiredTokens.every((token) =>
      text.toLowerCase().includes(token.toLowerCase()),
    );
    if (ok && text.trim().length > 40) {
      return { text: text.trim(), source: "ai" };
    }
  } catch {
    // Fall back to the validated template. Never serve unchecked AI maths.
  }
  return { text: explanation, source: "template" };
}
