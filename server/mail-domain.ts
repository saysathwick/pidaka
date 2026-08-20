import { resolveMx, resolve4 } from "node:dns/promises";
import { isDemoMode } from "./db";

export async function mailDomainLooksReal(domain: string): Promise<boolean> {
  if (isDemoMode) return true;
  const lookup = (async () => {
    try {
      const mx = await resolveMx(domain);
      if (mx.length > 0) return true;
    } catch {
      // some small hosts only have an A record
    }
    try {
      const addresses = await resolve4(domain);
      return addresses.length > 0;
    } catch {
      return false;
    }
  })();
  const timed = await Promise.race([
    lookup,
    new Promise<"timeout">((resolve) => {
      setTimeout(() => resolve("timeout"), 2500);
    }),
  ]);
  if (timed === "timeout") return true;
  return timed;
}
