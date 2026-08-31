import { describe, expect, it } from "vitest";
import { anonymousNickname, normaliseClassCode, sanitiseNickname } from "../shared/nicknames";

describe("nicknames", () => {
  it("accepts a classroom-friendly name", () => {
    const result = sanitiseNickname("Tutorial B", false);
    expect(result).toEqual({ ok: true, nickname: "Tutorial B", anonymous: false });
  });

  it("rejects too-short, too-long, and blocked names", () => {
    expect(sanitiseNickname("x", false).ok).toBe(false);
    expect(sanitiseNickname("a".repeat(30), false).ok).toBe(false);
    expect(sanitiseNickname("admin", false).ok).toBe(false);
    expect(sanitiseNickname("hello shit", false).ok).toBe(false);
  });

  it("issues anonymous IDs instead of collecting personal data", () => {
    const result = sanitiseNickname("", true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.anonymous).toBe(true);
      expect(result.nickname).toMatch(/^[A-Za-z]+-\d{4}$/);
    }
  });

  it("creates anonymous names from a supplied rng", () => {
    expect(anonymousNickname(() => 0)).toBe("Storm-1000");
  });
});

describe("class codes", () => {
  it("normalises tutorial-group codes", () => {
    expect(normaliseClassCode("  geog101  ")).toBe("GEOG101");
  });

  it("rejects symbols that would leak emails or messy input", () => {
    expect(() => normaliseClassCode("a@b.com")).toThrow();
  });
});
