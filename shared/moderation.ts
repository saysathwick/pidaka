export const MODERATION_KEYWORD_LIMIT = 300;
export const MODERATION_KEYWORD_MAX_LENGTH = 48;

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
      .slice(0, MODERATION_KEYWORD_MAX_LENGTH);
    if (word.replace(/\*/g, "").trim().length < 2 || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= MODERATION_KEYWORD_LIMIT) break;
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

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
  "!": "i",
  "|": "l",
};

const NON_WORD = new RegExp("[^\\p{L}\\p{N}\\p{M}]+", "u");
const SYMBOLIC = new RegExp("[^\\p{L}\\p{N}\\p{M}\\s*'’\\-]", "u");
const REPEATED = new RegExp("(.)\\1+", "gu");

/** Runs of 3+ single letters ("s u i c i d e") are joined back into one word. */
function joinSpelledOut(words: string[]): string[] {
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 3) out.push(run.join(""));
    else out.push(...run);
    run = [];
  };
  for (const word of words) {
    if (Array.from(word).length === 1) {
      run.push(word);
    } else {
      flush();
      out.push(word);
    }
  }
  flush();
  return out;
}

function words(text: string, leet: boolean): string[] {
  let s = text.normalize("NFKC").toLowerCase().replace(/['’]/g, "");
  if (leet) s = s.replace(/[0134578@$!|]/g, (c) => LEET[c] ?? c);
  return joinSpelledOut(s.split(NON_WORD).filter(Boolean));
}

function squeeze(word: string): string {
  return word.replace(REPEATED, "$1");
}

function views(text: string): string[] {
  const out: string[] = [];
  for (const leet of [false, true]) {
    const w = words(text, leet);
    out.push(w.join(" "), w.map(squeeze).join(" "));
  }
  return out;
}

/**
 * Whole-word, case-insensitive match that also sees through leetspeak (k1ll),
 * spelled-out letters (s u i c i d e) and stretched letters (diiie).
 * A trailing or leading `*` matches word starts or ends (suicid* → suicidal).
 * Keywords containing symbols (+91, bit.ly, @gmail.com) match as plain substrings.
 */
export function matchModerationKeywords(content: string, keywords: string[]): string[] {
  const lower = content.normalize("NFKC").toLowerCase();
  const haystacks = views(content).map((v) => ` ${v} `);
  const hits: string[] = [];

  for (const keyword of keywords) {
    if (!keyword) continue;
    const core = keyword.replace(/^\*+|\*+$/g, "");
    if (SYMBOLIC.test(core)) {
      if (lower.includes(core)) hits.push(keyword);
      continue;
    }

    const openStart = keyword.startsWith("*");
    const openEnd = keyword.endsWith("*");
    const needles = views(core);
    const matched = needles.some((needle, i) => {
      if (!needle) return false;
      const probe = `${openStart ? "" : " "}${needle}${openEnd ? "" : " "}`;
      return haystacks[i].includes(probe);
    });
    if (matched) hits.push(keyword);
  }
  return hits;
}
