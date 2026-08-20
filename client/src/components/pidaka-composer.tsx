import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { cn } from "@/lib/utils";
import { TEXT_LIMIT, useLimitedText } from "@/hooks/use-limited-text";
import { useVisualViewport } from "@/hooks/use-visual-viewport";

export const COMPOSER_PROMPTS = [
  "Say it to the wall.",
  "A secret you would not sign.",
  "What did you almost send?",
  "Tell the wall. Not them.",
  "Leave something that cannot keep your name.",
];

interface PidakaComposerProps {
  value: string;
  pending: boolean;
  isGuest: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onGuestClick: () => void;
  autoFocus?: boolean;
  testId?: string;
  compact?: boolean;
}

export function PidakaComposer({
  value,
  pending,
  isGuest,
  onChange,
  onSubmit,
  onGuestClick,
  autoFocus,
  testId = "input-pidaka-content",
  compact = false,
}: PidakaComposerProps) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [modKey, setModKey] = useState("Ctrl");
  const { handleChange, trimmed, used, remaining } = useLimitedText(value, onChange);

  useEffect(() => {
    setModKey(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    if (value.trim()) return;
    const id = window.setInterval(() => {
      setPromptIndex((i) => (i + 1) % COMPOSER_PROMPTS.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [value]);

  if (isGuest) {
    return (
      <button
        type="button"
        onClick={onGuestClick}
        className="composer-glass group w-full text-left rounded-xl border px-5 py-5 hover-elevate"
        data-testid="button-guest-composer"
      >
        <p className="font-serif text-xl sm:text-2xl tracking-tight">
          {COMPOSER_PROMPTS[promptIndex]}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Reading is free. We will name you. The wall will never show it.
        </p>
        <span className="mt-3 inline-flex min-h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
          Drop your mask
        </span>
      </button>
    );
  }

  const usedRatio = used / TEXT_LIMIT;
  const atLimit = remaining === 0;

  const fields = (
    <div className="flex flex-col gap-3 p-4">
      <Textarea
        placeholder={COMPOSER_PROMPTS[promptIndex]}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            if (value.trim() && !pending) onSubmit();
          }
        }}
        className={cn(
          "resize-none text-sm border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
          compact ? "min-h-[72px] max-h-[22vh]" : "min-h-[120px]",
        )}
        autoFocus={autoFocus}
        aria-describedby={atLimit ? `${testId}-limit` : undefined}
        data-testid={testId}
      />
      <div className="h-px w-full rounded-full bg-primary/35 overflow-hidden" aria-hidden>
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-200",
            atLimit ? "bg-destructive" : "bg-primary/80",
          )}
          style={{ width: `${Math.max((1 - usedRatio) * 100, 0)}%` }}
        />
      </div>
      {trimmed && (
        <p id={`${testId}-limit`} className="text-xs text-destructive" data-testid={`${testId}-limit`}>
          Too long. We kept the first {TEXT_LIMIT} characters. The rest was not taken.
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            className={cn(
              "text-[11px] tabular-nums tracking-wide",
              atLimit ? "text-destructive" : remaining < 200 ? "text-primary" : "text-muted-foreground",
            )}
            data-testid={`${testId}-count`}
          >
            {used} / {TEXT_LIMIT}
          </span>
          <span className="text-[10px] text-muted-foreground/80">
            {modKey} Enter to drop
          </span>
        </div>
        <Button
          onClick={onSubmit}
          disabled={!value.trim() || pending}
          data-testid={testId === "input-pidaka-content" ? "button-post-pidaka" : "button-post-pidaka-overlay"}
        >
          <Send className="h-4 w-4 mr-1.5" />
          {pending ? "Dropping..." : "Drop it on the wall"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="composer-glass rounded-xl border">
      {fields}
    </div>
  );
}

export function ComposeFab({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed z-40"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(1.25rem, env(safe-area-inset-bottom))",
          }}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            type="button"
            className="pointer-events-auto h-12 rounded-full px-4 shadow-lg sm:h-12 sm:px-5"
            onClick={onClick}
            data-testid="button-compose-anywhere"
          >
            <BurningCookieIcon className="h-4 w-4 mr-2" isLit />
            Drop it
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ComposeOverlay({
  open,
  value,
  pending,
  onChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const viewport = useVisualViewport(open);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed left-0 z-[70] flex w-full items-end justify-center sm:items-center"
          style={{ top: viewport.top, height: viewport.height }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close composer"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Say it to the wall"
            className="relative z-10 w-full max-w-2xl max-h-full overflow-y-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            data-testid="compose-overlay"
          >
            <PidakaComposer
              value={value}
              pending={pending}
              isGuest={false}
              onChange={onChange}
              onSubmit={onSubmit}
              onGuestClick={() => undefined}
              autoFocus
              compact
              testId="input-pidaka-content-overlay"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
