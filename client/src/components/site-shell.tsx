import type { ReactNode } from "react";
import { AppHeader, type HeaderPlace } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

export function SiteShell({
  children,
  place,
  fetching,
  paddedFooter,
  className,
}: {
  children: ReactNode;
  place: HeaderPlace;
  fetching?: boolean;
  paddedFooter?: boolean;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background wall-atmosphere">
      <AppHeader place={place} fetching={fetching} />
      <div className={cn("flex-1", className)}>{children}</div>
      <SiteFooter padded={paddedFooter} />
    </div>
  );
}
