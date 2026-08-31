export async function rateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; remaining: number }> {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const kvKey = `rl:${key}:${bucket}`;
  const current = Number((await kv.get(kvKey)) ?? "0");
  if (current >= limit) {
    return { ok: false, remaining: 0 };
  }
  await kv.put(kvKey, String(current + 1), { expirationTtl: windowSeconds * 2 });
  return { ok: true, remaining: limit - current - 1 };
}
