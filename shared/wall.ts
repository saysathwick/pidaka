export type NoticeLink = {
  name: string;
  href: string;
  file?: boolean;
};

export const NOTICE_STYLES = ["still", "scroll", "blink", "pulse"] as const;
export type NoticeStyle = (typeof NOTICE_STYLES)[number];

export const NOTICE_STYLE_LABELS: Record<NoticeStyle, string> = {
  still: "Still",
  scroll: "Scrolling",
  blink: "Blinking",
  pulse: "Breathing",
};

export const NOTICE_FONTS = ["sans", "serif", "mono"] as const;
export type NoticeFont = (typeof NOTICE_FONTS)[number];

export const NOTICE_FONT_LABELS: Record<NoticeFont, string> = {
  sans: "Sans",
  serif: "Serif",
  mono: "Mono",
};

export const NOTICE_SIZES = ["sm", "md", "lg", "xl"] as const;
export type NoticeSize = (typeof NOTICE_SIZES)[number];

export const NOTICE_SIZE_LABELS: Record<NoticeSize, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "Huge",
};

export const NOTICE_COLORS = ["muted", "ember", "snow", "copper", "ochre", "wine", "indigo", "blue"] as const;
export type NoticeColor = (typeof NOTICE_COLORS)[number];

export const NOTICE_COLOR_LABELS: Record<NoticeColor, string> = {
  muted: "Quiet",
  ember: "Ember",
  snow: "Snow",
  copper: "Copper",
  ochre: "Ochre",
  wine: "Wine",
  indigo: "Indigo",
  blue: "Blue",
};

export type WallSettings = {
  googleLogin: boolean;
  appleLogin: boolean;
  phoneLogin: boolean;
  emailLogin: boolean;
  registrationsOpen: boolean;
  postingOpen: boolean;
  burningOpen: boolean;
  noticeOpen: boolean;
  notice: string;
  noticeLinks: NoticeLink[];
  noticeStyle: NoticeStyle;
  noticeFont: NoticeFont;
  noticeSize: NoticeSize;
  noticeColor: NoticeColor;
};

export type PublicWall = {
  google: boolean;
  apple: boolean;
  phone: boolean;
  email: boolean;
  registrations: boolean;
  posting: boolean;
  burning: boolean;
  noticeOpen: boolean;
  notice: string;
  noticeLinks: NoticeLink[];
  noticeStyle: NoticeStyle;
  noticeFont: NoticeFont;
  noticeSize: NoticeSize;
  noticeColor: NoticeColor;
  googleReady: boolean;
  appleReady: boolean;
};

export type AdminPidaka = {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  creatorUserId: string;
  anonymousName: string;
};

export type AdminUser = {
  id: string;
  email: string;
  anonymousName: string;
  authProvider: string;
  createdAt: string;
};

export type AdminStats = {
  users: number;
  pidakas: number;
  burns: number;
};

export const WALL_SETTINGS_ID = "wall";

export function settingsHaveADoor(settings: WallSettings) {
  return settings.googleLogin || settings.appleLogin || settings.phoneLogin || settings.emailLogin;
}

const FILE_EXT =
  /\.(apk|aab|ipa|dmg|pkg|exe|msi|zip|gz|tgz|rar|7z|pdf|csv|tsv|xlsx?|docx?|pptx?|txt|json|xml|mp3|wav|ogg|mp4|mov|png|jpe?g|webp|gif|svg|ics)$/i;

export function noticeLinkLooksLikeFile(href: string) {
  try {
    return FILE_EXT.test(new URL(href).pathname);
  } catch {
    return false;
  }
}

export function noticeLinkIsFile(link: NoticeLink) {
  return Boolean(link.file) || noticeLinkLooksLikeFile(link.href);
}

export function sanitizeNoticeLink(item: unknown): NoticeLink | null {
  if (!item || typeof item !== "object") return null;
  const record = item as { name?: unknown; href?: unknown; file?: unknown };
  const name = String(record.name ?? "").trim().slice(0, 48);
  const hrefRaw = String(record.href ?? "").trim();
  if (!name || !hrefRaw) return null;
  let url: URL;
  try {
    url = new URL(hrefRaw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const link: NoticeLink = { name, href: url.toString() };
  if (record.file) link.file = true;
  return link;
}

export function sanitizeNoticeLinks(raw: unknown): NoticeLink[] {
  if (!Array.isArray(raw)) return [];
  const links: NoticeLink[] = [];
  const seen = new Set<string>();
  for (const item of raw.slice(0, 4)) {
    const link = sanitizeNoticeLink(item);
    if (!link || seen.has(link.href)) continue;
    seen.add(link.href);
    links.push(link);
  }
  return links;
}

export function parseNoticeStyle(raw: unknown): NoticeStyle {
  return NOTICE_STYLES.includes(raw as NoticeStyle) ? (raw as NoticeStyle) : "still";
}

export function parseNoticeFont(raw: unknown): NoticeFont {
  return NOTICE_FONTS.includes(raw as NoticeFont) ? (raw as NoticeFont) : "sans";
}

export function parseNoticeSize(raw: unknown): NoticeSize {
  return NOTICE_SIZES.includes(raw as NoticeSize) ? (raw as NoticeSize) : "md";
}

export function parseNoticeColor(raw: unknown): NoticeColor {
  return NOTICE_COLORS.includes(raw as NoticeColor) ? (raw as NoticeColor) : "muted";
}

export function parseNoticeLinks(raw: unknown): NoticeLink[] {
  if (typeof raw === "string") {
    try {
      return sanitizeNoticeLinks(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return sanitizeNoticeLinks(raw);
}
