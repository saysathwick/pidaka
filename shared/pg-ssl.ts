/**
 * Railway often concatenates two connection strings into one DATABASE_URL
 * (plugin variable + a second reference). Postgres then treats everything
 * after the first "/railway" as the database name.
 */
export function normalizeDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim().replace(/^['"]|['"]$/g, "");
  const urls = value
    .split(/(?=postgres(?:ql)?:\/\/)/i)
    .map((part) => part.trim())
    .filter((part) => /^postgres(?:ql)?:\/\//i.test(part));
  if (urls.length === 0) return value;
  const internal = urls.find((url) => /\.railway\.internal/i.test(url));
  if (urls.length > 1) {
    console.warn(
      `[postgres] DATABASE_URL contained ${urls.length} concatenated URLs; using ${internal ? "the private Railway host" : "the first URL"}`,
    );
  }
  return internal ?? urls[0];
}

/** Railway private Postgres does not speak TLS. Public URLs usually do. */
export function databaseUsesSsl(url: string): boolean {
  if (/\.railway\.internal(?::|\/|$)/i.test(url)) return false;
  if (/[?&]sslmode=disable\b/i.test(url)) return false;
  if (/[?&]sslmode=/i.test(url)) return true;
  const mode = process.env.PGSSLMODE?.toLowerCase();
  if (mode === "disable") return false;
  if (mode) return true;
  if (/\blocalhost\b|\b127\.0\.0\.1\b/.test(url)) return false;
  return process.env.NODE_ENV === "production";
}
