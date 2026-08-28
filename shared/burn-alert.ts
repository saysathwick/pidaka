export const DEFAULT_BURN_ALERT_TITLE = "Pidaka";
export const DEFAULT_BURN_ALERT_BODY_ONE = "A burn arrived.";
export const DEFAULT_BURN_ALERT_BODY_MANY = "{n} burns are waiting.";

export type BurnAlertTemplate = {
  burnAlertTitle: string;
  burnAlertBodyOne: string;
  burnAlertBodyMany: string;
};

export function defaultBurnAlertTemplate(): BurnAlertTemplate {
  return {
    burnAlertTitle: DEFAULT_BURN_ALERT_TITLE,
    burnAlertBodyOne: DEFAULT_BURN_ALERT_BODY_ONE,
    burnAlertBodyMany: DEFAULT_BURN_ALERT_BODY_MANY,
  };
}

function sanitizeLine(raw: unknown, max: number, fallback: string) {
  const text = String(raw ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);
  return text || fallback;
}

export function sanitizeBurnAlertTitle(raw: unknown) {
  return sanitizeLine(raw, 48, DEFAULT_BURN_ALERT_TITLE);
}

export function sanitizeBurnAlertBodyOne(raw: unknown) {
  return sanitizeLine(raw, 120, DEFAULT_BURN_ALERT_BODY_ONE);
}

export function sanitizeBurnAlertBodyMany(raw: unknown) {
  return sanitizeLine(raw, 120, DEFAULT_BURN_ALERT_BODY_MANY);
}

export function burnAlertFromSettings(settings: Partial<BurnAlertTemplate>): BurnAlertTemplate {
  return {
    burnAlertTitle: sanitizeBurnAlertTitle(settings.burnAlertTitle),
    burnAlertBodyOne: sanitizeBurnAlertBodyOne(settings.burnAlertBodyOne),
    burnAlertBodyMany: sanitizeBurnAlertBodyMany(settings.burnAlertBodyMany),
  };
}

export function renderBurnAlert(template: Partial<BurnAlertTemplate>, unread: number) {
  const alert = burnAlertFromSettings(template);
  const n = Math.max(1, unread);
  const bodyPattern = n === 1 ? alert.burnAlertBodyOne : alert.burnAlertBodyMany;
  const body = bodyPattern.replace(/\{n\}/g, String(n));
  return { title: alert.burnAlertTitle, body };
}

export type BurnAlertPayload = {
  kind: "burn";
  n: number;
  title: string;
  body: string;
};

export function burnAlertPayload(template: Partial<BurnAlertTemplate>, unread: number): BurnAlertPayload {
  const n = Math.max(1, unread);
  const { title, body } = renderBurnAlert(template, n);
  return { kind: "burn", n, title, body };
}
