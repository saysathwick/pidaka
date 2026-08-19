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
