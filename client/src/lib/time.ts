const TOTAL_LIFE_MS = 48 * 60 * 60 * 1000;
const DYING_MS = 2 * 60 * 60 * 1000;

export function getExpiryState(expiresAt: string, now = Date.now()) {
  const remaining = new Date(expiresAt).getTime() - now;
  const ratio = Math.max(0, Math.min(1, remaining / TOTAL_LIFE_MS));
  return {
    remaining,
    ratio,
    isGone: remaining <= 0,
    isDying: remaining > 0 && remaining <= DYING_MS,
    label: formatRemaining(remaining),
  };
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "gone";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1) {
    return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
  }
  if (totalMinutes >= 1) return `${totalMinutes}m left`;
  return "moments left";
}
