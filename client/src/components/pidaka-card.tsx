import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { TextPager } from "@/components/paged-copy";
import { cn } from "@/lib/utils";
import { paginateText } from "@/lib/text-pages";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const reported = useRef(false);
  const pages = useMemo(() => paginateText(pidaka.content), [pidaka.content]);
  const [page, setPage] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [hoverFine, setHoverFine] = useState(false);

  useEffect(() => {
    setHoverFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    setPage(0);
    setEngaged(false);
  }, [pidaka.id, pidaka.content]);

  useEffect(() => {
    if (!engaged || pages.length <= 1) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPage((current) => Math.max(0, current - 1));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPage((current) => Math.min(pages.length - 1, current + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engaged, pages.length]);

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

  const index = Math.min(page, pages.length - 1);
  const multi = pages.length > 1;

  return (
    <div
      ref={rootRef}
      className="relative h-56"
      onMouseEnter={() => {
        if (multi) setEngaged(true);
      }}
      onMouseLeave={() => {
        if (!hoverFine) return;
        setEngaged(false);
        setPage(0);
      }}
      onClick={() => {
        if (multi) setEngaged(true);
      }}
    >
      <div
        className={cn(
          "composer-glass flex h-full flex-col rounded-xl border hover-elevate active-elevate-2",
          arrived && "ring-1 ring-primary/35",
          pidaka.isOwn && "own-pidaka",
        )}
        data-testid={`card-pidaka-${pidaka.id}`}
      >
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-5 pt-5 pb-4">
          <p
            className="min-h-0 flex-1 overflow-hidden text-[15px] leading-relaxed whitespace-pre-wrap break-words"
            data-testid={`text-content-${pidaka.id}`}
          >
            {pages[index]}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <time
                className="text-[11px] text-muted-foreground tabular-nums"
                dateTime={pidaka.createdAt}
                data-testid={`text-time-${pidaka.id}`}
              >
                {formatDistanceToNow(new Date(pidaka.createdAt), { addSuffix: true })}
              </time>
              {multi && (
                engaged ? (
                  <TextPager
                    page={index}
                    pages={pages.length}
                    onPage={setPage}
                    id={pidaka.id}
                  />
                ) : (
                  <span className="text-[11px] tabular-nums tracking-[0.16em] text-muted-foreground/70">
                    {index + 1}/{pages.length}
                  </span>
                )
              )}
            </div>
            {pidaka.isOwn ? (
              <span className="text-[11px] uppercase tracking-[0.18em] text-primary">
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
      </div>
    </div>
  );
}
