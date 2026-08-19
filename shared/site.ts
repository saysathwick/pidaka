export const SITE_NAME = "Pidaka";

export const SITE_TAGLINE =
  "Anonymous opinions from strangers. No identity. No followers. Just truth.";

export const OPERATOR = {
  legalName: "Phito Innovative Solutions Private Limited",
  email: "hello@phito.in",
  website: "https://www.phito.in",
  addressLines: [
    "India"
  ],
} as const;

export const LEGAL_UPDATED = "19 August 2026";

export const APP_PATHS = ["/", "/inbox", "/about", "/privacy", "/terms", "/contact"] as const;

export type AppPath = (typeof APP_PATHS)[number];

type PageMeta = {
  title: string;
  description: string;
};

const PAGE_META: Record<AppPath, PageMeta> = {
  "/": {
    title: "Pidaka",
    description: SITE_TAGLINE,
  },
  "/inbox": {
    title: "Burns — Pidaka",
    description: "Private replies to your pidakas. The sender is never named.",
  },
  "/about": {
    title: "About — Pidaka",
    description: "No identity. No followers. Just truth. What Pidaka is, and how to reach Phito.",
  },
  "/privacy": {
    title: "Privacy — Pidaka",
    description: "How Pidaka collects, uses, and removes account and wall data.",
  },
  "/terms": {
    title: "Terms — Pidaka",
    description: "The terms that govern use of the Pidaka wall.",
  },
  "/contact": {
    title: "Contact — Pidaka",
    description: "Registered office, email, and how to reach Phito about Pidaka.",
  },
};

const NOT_FOUND_META: PageMeta = {
  title: "Lost — Pidaka",
  description: "This room does not exist. The wall is still here.",
};

export function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0] || "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function isAppPath(pathname: string): pathname is AppPath {
  return (APP_PATHS as readonly string[]).includes(normalizePath(pathname));
}

export function metaForPath(pathname: string): PageMeta {
  const path = normalizePath(pathname);
  if (isAppPath(path)) return PAGE_META[path];
  return NOT_FOUND_META;
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function applyDocumentMeta(html: string, pathname: string, origin = "") {
  const meta = metaForPath(pathname);
  const path = normalizePath(pathname);
  const canonicalPath = path === "/" ? "/" : path;
  const canonical = origin ? `${origin}${canonicalPath}` : canonicalPath;
  const image = origin ? `${origin}/og.png` : "/og.png";

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(meta.title)}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${escapeAttr(meta.description)}$2`,
    )
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${escapeAttr(meta.title)}$2`,
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${escapeAttr(meta.description)}$2`,
    )
    .replace(
      /(<meta property="og:url" content=")[^"]*(")/,
      `$1${escapeAttr(canonical)}$2`,
    )
    .replace(
      /(<meta property="og:image" content=")[^"]*(")/,
      `$1${escapeAttr(image)}$2`,
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${escapeAttr(meta.title)}$2`,
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${escapeAttr(meta.description)}$2`,
    )
    .replace(
      /(<meta name="twitter:image" content=")[^"]*(")/,
      `$1${escapeAttr(image)}$2`,
    );
}
