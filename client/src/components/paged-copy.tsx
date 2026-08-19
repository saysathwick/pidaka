import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { paginateText } from "@/lib/text-pages";

export function TextPager({
  page,
  pages,
  onPage,
  id,
}: {
  page: number;
  pages: number;
  onPage: (next: number) => void;
  id: string;
}) {
  if (pages <= 1) return null;
  return (
    <div
      className="inline-flex items-center text-[11px] tabular-nums tracking-[0.16em] text-muted-foreground"
      data-testid={`pager-${id}`}
    >
      <button
        type="button"
        className="px-1.5 py-0.5 text-foreground disabled:text-muted-foreground/25"
        disabled={page <= 0}
        onClick={(event) => {
          event.stopPropagation();
          onPage(page - 1);
        }}
        aria-label="Previous page"
        data-testid={`button-page-prev-${id}`}
      >
        ‹
      </button>
      <span data-testid={`text-page-${id}`}>
        {page + 1}/{pages}
      </span>
      <button
        type="button"
        className="px-1.5 py-0.5 text-foreground disabled:text-muted-foreground/25"
        disabled={page >= pages - 1}
        onClick={(event) => {
          event.stopPropagation();
          onPage(page + 1);
        }}
        aria-label="Next page"
        data-testid={`button-page-next-${id}`}
      >
        ›
      </button>
    </div>
  );
}

export function PagedCopy({
  text,
  className,
  testId,
  engaged,
  onEngaged,
}: {
  text: string;
  className?: string;
  testId?: string;
  engaged?: boolean;
  onEngaged?: () => void;
}) {
  const pages = useMemo(() => paginateText(text), [text]);
  const [page, setPage] = useState(0);
  const [localEngaged, setLocalEngaged] = useState(false);
  const [hoverFine, setHoverFine] = useState(false);

  useEffect(() => {
    setHoverFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    setPage(0);
    setLocalEngaged(false);
  }, [text]);

  const active = engaged ?? localEngaged;
  const index = Math.min(page, pages.length - 1);
  const multi = pages.length > 1;
  const showPager = multi && active;

  return (
    <div
      className="flex min-h-0 flex-col gap-2"
      onMouseEnter={() => {
        if (!multi) return;
        setLocalEngaged(true);
        onEngaged?.();
      }}
      onMouseLeave={() => {
        if (!hoverFine) return;
        setLocalEngaged(false);
        setPage(0);
      }}
      onClick={() => {
        if (!multi) return;
        setLocalEngaged(true);
        onEngaged?.();
      }}
    >
      <p
        className={cn("min-h-0 overflow-hidden whitespace-pre-wrap break-words leading-relaxed", className)}
        data-testid={testId}
      >
        {pages[index]}
      </p>
      {showPager && (
        <TextPager
          page={index}
          pages={pages.length}
          onPage={setPage}
          id={testId ?? "copy"}
        />
      )}
    </div>
  );
}
