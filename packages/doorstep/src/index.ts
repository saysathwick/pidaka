export interface DoorstepItem {
  id: string;
  creatorId: string;
  createdAt: Date | string;
  expiresAt: Date | string;
}

export interface QueueForViewerInput<T extends DoorstepItem> {
  items: readonly T[];
  viewerId: string;
  seenIds?: Iterable<string>;
  witnessCounts?: Record<string, number> | Map<string, number>;
  now?: Date;
}

function toTime(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function witnessOf(
  counts: QueueForViewerInput<DoorstepItem>["witnessCounts"],
  id: string,
): number {
  if (!counts) return 0;
  if (counts instanceof Map) return counts.get(id) ?? 0;
  return counts[id] ?? 0;
}

/**
 * Complete doorstep queue: every live item except the viewer's own,
 * unseen first, then first-to-expire, then least witnessed.
 * Nothing is sampled or ranked by popularity.
 */
export function queueForViewer<T extends DoorstepItem>({
  items,
  viewerId,
  seenIds = [],
  witnessCounts,
  now = new Date(),
}: QueueForViewerInput<T>): T[] {
  const nowMs = now.getTime();
  const seen = seenIds instanceof Set ? seenIds : new Set(seenIds);

  const live = items.filter((item) => toTime(item.expiresAt) > nowMs);
  const others = live.filter((item) => item.creatorId !== viewerId);

  return [...others].sort((a, b) => {
    const aSeen = seen.has(a.id) ? 1 : 0;
    const bSeen = seen.has(b.id) ? 1 : 0;
    if (aSeen !== bSeen) return aSeen - bSeen;

    const expireDelta = toTime(a.expiresAt) - toTime(b.expiresAt);
    if (expireDelta !== 0) return expireDelta;

    const witnessDelta = witnessOf(witnessCounts, a.id) - witnessOf(witnessCounts, b.id);
    if (witnessDelta !== 0) return witnessDelta;

    return toTime(a.createdAt) - toTime(b.createdAt);
  });
}

export interface ConservationInput {
  items: readonly DoorstepItem[];
  viewerIds: readonly string[];
  witnessed: Map<string, ReadonlySet<string>> | Record<string, readonly string[]>;
  now?: Date;
}

function viewersOf(
  witnessed: ConservationInput["witnessed"],
  itemId: string,
): ReadonlySet<string> {
  if (witnessed instanceof Map) return witnessed.get(itemId) ?? new Set();
  return new Set(witnessed[itemId] ?? []);
}

/**
 * required = each live item × (every other person in the village).
 * expiredUnseen = items that died with at least one required viewer who never met them.
 */
export function conservation({
  items,
  viewerIds,
  witnessed,
  now = new Date(),
}: ConservationInput) {
  const nowMs = now.getTime();
  let required = 0;
  let seenMeetings = 0;
  let expiredUnseen = 0;

  for (const item of items) {
    const others = viewerIds.filter((id) => id !== item.creatorId);
    required += others.length;
    const met = viewersOf(witnessed, item.id);
    for (const viewerId of others) {
      if (met.has(viewerId)) seenMeetings += 1;
    }
    const dead = toTime(item.expiresAt) <= nowMs;
    if (dead) {
      const missed = others.some((id) => !met.has(id));
      if (missed) expiredUnseen += 1;
    }
  }

  return {
    required,
    witnessed: seenMeetings,
    expiredUnseen,
    coverage: required === 0 ? 1 : seenMeetings / required,
  };
}
