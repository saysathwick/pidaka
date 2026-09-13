export function sanitizeModerationKeywords(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : raw.split(/[\n,]+/);
          } catch {
            return raw.split(/[\n,]+/);
          }
        })()
      : [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const word = String(item ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .slice(0, 48);
    if (word.length < 2 || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= 100) break;
  }
  return out;
}

export function parseModerationKeywords(raw: unknown): string[] {
  if (typeof raw === "string") {
    try {
      return sanitizeModerationKeywords(JSON.parse(raw));
    } catch {
      return sanitizeModerationKeywords(raw);
    }
  }
  return sanitizeModerationKeywords(raw);
}

/** Case-insensitive substring match. Returns matched keywords (unique). */
export function matchModerationKeywords(content: string, keywords: string[]): string[] {
  const hay = content.toLowerCase();
  const hits: string[] = [];
  for (const word of keywords) {
    if (word && hay.includes(word)) hits.push(word);
  }
  return hits;
}
