const STEMS = [
  "Ash",
  "Ember",
  "Cinder",
  "Soot",
  "Night",
  "Dusk",
  "Smoke",
  "Veil",
  "Char",
  "Wick",
  "Hearth",
  "Gloam",
] as const;

export function generateAnonymousName(): string {
  const stem = STEMS[Math.floor(Math.random() * STEMS.length)];
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${stem} ${n}`;
}

export function excerptPidaka(content: string, max = 140): string {
  const trimmed = content.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}
