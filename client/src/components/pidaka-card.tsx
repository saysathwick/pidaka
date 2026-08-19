import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { getExpiryState } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface PidakaItem {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  isOwn?: boolean;
  seen?: boolean;
}

interface PidakaCardProps {
  pidaka: PidakaItem;
  onBurn: (id: string) => void;
  arrived?: boolean;
  onSeen?: (id: string) => void;
}

export function PidakaCard({ pidaka, onBurn, arrived, onSeen }: PidakaCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const rootRef = useRef<HTMLDivElement>(null);
  const reported = useRef(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (pidaka.isOwn || pidaka.seen || !onSeen) return;
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || reported.current) return;
        reported.current = true;
        onSeen(pidaka.id);
        observer.disconnect();
      },
      { threshold: 0.55 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pidaka.id, pidaka.isOwn, pidaka.seen, onSeen]);

  const expiry = getExpiryState(pidaka.expiresAt, now);

  return (
    <Card
      ref={rootRef}
      className={cn(
        "hover-elevate overflow-hidden transition-colors duration-300",
        expiry.isDying && "border-destructive/40 bg-destructive/[0.04]",
        arrived && "ring-1 ring-primary/35",
      )}
      data-testid={`card-pidaka-${pidaka.id}`}
    >
      <CardContent className="pt-5 pb-4 flex flex-col gap-4">
        <p
          className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
          data-testid={`text-content-${pidaka.id}`}
        >
          {pidaka.content}
        </p>
        <div className="flex flex-col gap-2">
          <div
            className="h-[2px] w-full rounded-full bg-border overflow-hidden"
            aria-hidden
          >
            <div
              className={cn(
                "h-full origin-left rounded-full",
                expiry.isDying ? "bg-destructive fuse-dying" : "bg-primary",
              )}
              style={{ width: `${Math.max(expiry.ratio * 100, 1.5)}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={cn(
                "text-[11px] uppercase tracking-[0.18em]",
                expiry.isDying ? "text-destructive" : "text-muted-foreground",
              )}
              data-testid={`text-time-${pidaka.id}`}
            >
              {expiry.label}
            </span>
            {pidaka.isOwn ? (
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                yours
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBurn(pidaka.id)}
                className="text-primary"
                data-testid={`button-burn-${pidaka.id}`}
              >
                <BurningCookieIcon className="h-3.5 w-3.5 mr-1" isLit />
                Burn
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
