export interface DoorstepItem {
  id: string;
  creatorId?: string;
  creator_id?: string;
  createdAt?: Date | string | number;
  created_at?: Date | string | number;
  expiresAt?: Date | string | number;
  expires_at?: Date | string | number;
}

export interface QueueForViewerInput {
  items: DoorstepItem[];
  viewerId?: string;
  viewer_id?: string;
  seenIds?: Iterable<string>;
  seen_ids?: Iterable<string>;
  witnessCounts?: Record<string, number> | Map<string, number>;
  witness_counts?: Record<string, number> | Map<string, number>;
  now?: Date | string | number;
}

export interface ConservationInput {
  items: DoorstepItem[];
  viewerIds?: string[];
  viewer_ids?: string[];
  witnessed?: Record<string, Iterable<string>> | Map<string, Iterable<string>>;
  now?: Date | string | number;
}

export interface Conservation {
  required: number;
  witnessed: number;
  expiredUnseen: number;
  coverage: number;
}

export function queueForViewer(input: QueueForViewerInput): string[];
export function conservation(input: ConservationInput): Conservation;
