export const SITE_NAME = "Pidaka";

export const SITE_TAGLINE = "Speak freely. Anonymously.";

export const SITE_TAGLINE_LEAD = "Speak freely.";

export const SITE_TAGLINE_ACCENT = "Anonymously.";

export const OPERATOR = {
  legalName: "Phito Innovative Solutions Private Limited",
  email: "hello@phito.in",
  website: "https://www.phito.in",
  addressLines: [
    "India"
  ],
} as const;

export const LEGAL_UPDATED = "23 September 2026";

export const APP_PATHS = [
  "/",
  "/inbox",
  "/intro",
  "/how-it-works",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/delete-account",
  "/child-safety",
  "/hearth",
  "/hearth/users",
] as const;

export type AppPath = (typeof APP_PATHS)[number];

/** Public pages listed in sitemap.xml. Everything else in APP_PATHS is noindex. */
export const INDEXABLE_PATHS = [
  "/",
  "/how-it-works",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/delete-account",
  "/child-safety",
] as const satisfies readonly AppPath[];

export type PageMeta = {
  title: string;
  description: string;
  index: boolean;
};

const PAGE_META: Record<AppPath, Omit<PageMeta, "index">> = {
  "/": {
    title: "Pidaka — Speak freely. Anonymously.",
    description:
      "An anonymous wall for the things you would not sign. Read for free, leave a thought, and get private replies. No profiles, no followers. Gone in 48 hours.",
  },
  "/inbox": {
    title: "Burns — Pidaka",
    description: "Private replies to your pidakas. The sender is never named.",
  },
  "/intro": {
    title: "Welcome to Pidaka",
    description: "Discover, connect, let go. An interactive introduction to the anonymous wall.",
  },
  "/how-it-works": {
    title: "How Pidaka works — share thoughts anonymously",
    description:
      "How Pidaka works: leave a thought on a public wall without your name, read others for free, and send private anonymous replies called burns. Every pidaka leaves after 48 hours.",
  },
  "/about": {
    title: "About Pidaka — an anonymous wall for honest thoughts",
    description:
      "What Pidaka is: an anonymous wall where you share thoughts without a public identity, read others, and send private burns. Made by Phito in India.",
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
  "/delete-account": {
    title: "Delete account — Pidaka",
    description: "Request deletion of your Pidaka account and associated data.",
  },
  "/child-safety": {
    title: "Child safety — Pidaka",
    description: "Pidaka standards against child sexual abuse and exploitation (CSAE).",
  },
  "/hearth": {
    title: "Hearth — Pidaka",
    description: "The keeper's room.",
  },
  "/hearth/users": {
    title: "Hearth — Pidaka",
    description: "The keeper's room.",
  },
};

const NOT_FOUND_META: PageMeta = {
  title: "Lost — Pidaka",
  description: "This room does not exist. The wall is still here.",
  index: false,
};

export function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0] || "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function isAppPath(pathname: string): pathname is AppPath {
  return (APP_PATHS as readonly string[]).includes(normalizePath(pathname));
}

export function isIndexablePath(pathname: string): boolean {
  return (INDEXABLE_PATHS as readonly string[]).includes(normalizePath(pathname));
}

export function metaForPath(pathname: string): PageMeta {
  const path = normalizePath(pathname);
  if (isAppPath(path)) return { ...PAGE_META[path], index: isIndexablePath(path) };
  return NOT_FOUND_META;
}

export const ROBOTS_INDEX = "index, follow, max-image-preview:large";
export const ROBOTS_NOINDEX = "noindex, nofollow";

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** Organization + WebSite structured data so search engines know who runs Pidaka. */
export function structuredData(origin: string, extra: object[] = []) {
  const base = origin || "";
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      ...extra,
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: OPERATOR.legalName,
        url: OPERATOR.website,
        email: OPERATOR.email,
        logo: `${base}/logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: SITE_NAME,
        url: `${base}/`,
        description: PAGE_META["/"].description,
        inLanguage: "en",
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  });
  // Keep the JSON from closing the script tag early
  return json.replace(/</g, "\\u003c");
}

export type DocumentExtras = {
  /** Static HTML placed inside #root for crawlers; React replaces it on mount. */
  prerender?: string;
  /** Extra schema.org nodes for this page's structured data graph. */
  schema?: object[];
};

export function applyDocumentMeta(html: string, pathname: string, origin = "", extras: DocumentExtras = {}) {
  const meta = metaForPath(pathname);
  const path = normalizePath(pathname);
  const canonical = origin ? `${origin}${path}` : path;
  const image = origin ? `${origin}/og.png` : "/og.png";
  const ldJson = meta.index
    ? `<script type="application/ld+json">${structuredData(origin, extras.schema)}</script>\n  </head>`
    : "</head>";
  const withRoot = extras.prerender
    ? html.replace('<div id="root"></div>', () => `<div id="root">${extras.prerender}</div>`)
    : html;

  return withRoot
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(meta.title)}</title>`)
    .replace(
      /(<meta name="robots" content=")[^"]*(")/,
      `$1${meta.index ? ROBOTS_INDEX : ROBOTS_NOINDEX}$2`,
    )
    .replace(
      /(<link rel="canonical" href=")[^"]*(")/,
      `$1${escapeAttr(canonical)}$2`,
    )
    .replace("</head>", () => ldJson)
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
