import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const LONG_PRESS_MS = 420;

function MoreDots() {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-hidden
      data-testid="pidaka-more-dots"
    >
      <span className="pidaka-more-dot" />
      <span className="pidaka-more-dot" />
      <span className="pidaka-more-dot" />
    </span>
  );
}

export function PidakaCard({ pidaka, onBurn, arrived, onSeen }: PidakaCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const reported = useRef(false);
  const pressTimer = useRef<number | null>(null);
  const held = useRef(false);
  const pages = useMemo(() => paginateText(pidaka.content), [pidaka.content]);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setPage(0);
    setExpanded(false);
  }, [pidaka.id, pidaka.content]);

  useEffect(() => {
    return () => {
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (expanded) return;
    const full = measureRef.current;
    if (!full) return;
    const update = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(full).lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
      setHasMore(full.scrollHeight > lineHeight * 2 + 2);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(full);
    return () => observer.disconnect();
  }, [pidaka.content, expanded]);

  useEffect(() => {
    if (!expanded || pages.length <= 1) return;
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
  }, [expanded, pages.length]);

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

  const clearPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const canExpand = hasMore || expanded;
  const index = Math.min(page, pages.length - 1);
  const multi = pages.length > 1;

  const open = () => {
    if (!hasMore && !expanded) return;
    setExpanded(true);
  };

  const toggle = () => {
    if (!hasMore && !expanded) return;
    setExpanded((current) => {
      if (current) setPage(0);
      return !current;
    });
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative",
        expanded ? "h-56" : "h-[6.8rem] select-none",
        canExpand ? "cursor-pointer" : "cursor-default",
      )}
      onPointerDown={(event) => {
        if (event.button !== 0 || !canExpand) return;
        held.current = false;
        clearPress();
        pressTimer.current = window.setTimeout(() => {
          held.current = true;
          open();
        }, LONG_PRESS_MS);
      }}
      onPointerUp={clearPress}
      onPointerCancel={clearPress}
      onPointerLeave={clearPress}
      onClick={() => {
        if (held.current) {
          held.current = false;
          return;
        }
        toggle();
      }}
      onKeyDown={(event) => {
        if (!canExpand) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      }}
      tabIndex={canExpand ? 0 : undefined}
      aria-expanded={canExpand ? expanded : undefined}
    >
      <div
        className={cn(
          "composer-glass flex h-full flex-col rounded-xl border hover-elevate active-elevate-2",
          arrived && "ring-1 ring-primary/35",
          pidaka.isOwn && "own-pidaka",
        )}
        data-testid={`card-pidaka-${pidaka.id}`}
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden",
            expanded ? "gap-3 px-5 pt-5 pb-4" : "gap-2 px-4 py-3",
          )}
        >
          {expanded ? (
            <p
              className="min-h-0 flex-1 overflow-hidden text-[15px] leading-relaxed whitespace-pre-wrap break-words"
              data-testid={`text-content-${pidaka.id}`}
            >
              {pages[index]}
            </p>
          ) : (
            <div className="relative flex h-[3.05rem] items-center">
              <p
                ref={measureRef}
                className="invisible absolute inset-x-0 top-0 whitespace-pre-wrap break-words text-[15px] leading-relaxed"
                aria-hidden
              >
                {pidaka.content}
              </p>
              <p
                className={cn(
                  "w-full text-[15px] leading-relaxed whitespace-pre-wrap break-words line-clamp-2",
                  hasMore && "pr-7",
                )}
                data-testid={`text-content-${pidaka.id}`}
              >
                {pidaka.content}
              </p>
              {hasMore && (
                <span className="pointer-events-none absolute bottom-0.5 right-0">
                  <MoreDots />
                </span>
              )}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <time
                className="text-[11px] text-muted-foreground tabular-nums"
                dateTime={pidaka.createdAt}
                data-testid={`text-time-${pidaka.id}`}
              >
                {formatDistanceToNow(new Date(pidaka.createdAt), { addSuffix: true })}
              </time>
              {multi && expanded && (
                <TextPager
                  page={index}
                  pages={pages.length}
                  onPage={setPage}
                  id={pidaka.id}
                />
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
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onBurn(pidaka.id);
                }}
                className="h-7 px-2 text-primary"
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
