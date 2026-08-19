import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { PagedCopy } from "@/components/paged-copy";
import type { PidakaItem } from "@/components/pidaka-card";
import { cn } from "@/lib/utils";
import { TEXT_LIMIT, useLimitedText } from "@/hooks/use-limited-text";

interface BurnRitualProps {
  pidaka: PidakaItem | null;
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function BurnRitual({ pidaka, open, sending, onClose, onSend }: BurnRitualProps) {
  const [message, setMessage] = useState("");
  const { handleChange, trimmed, used, remaining } = useLimitedText(message, setMessage);
  const atLimit = remaining === 0;

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && pidaka && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20"
            aria-label="Close burn"
            onClick={handleClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-lg px-0 sm:px-4 pb-[max(0px,env(safe-area-inset-bottom))]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              role="dialog"
              aria-labelledby="burn-ritual-title"
              className="composer-glass rounded-t-2xl sm:rounded-xl border p-6 pb-8 flex flex-col gap-5"
              data-testid="burn-ritual"
            >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-primary/20 blur-md" />
                <BurningCookieIcon className="relative h-5 w-5" isLit />
              </div>
              <h2 id="burn-ritual-title" className="font-serif text-xl" data-testid="text-burn-dialog-title">
                Burn this. They will not know.
              </h2>
            </div>

            <blockquote className="font-serif text-[17px] text-muted-foreground border-l border-primary/40 pl-4">
              <PagedCopy text={pidaka.content} testId="text-burn-quote" />
            </blockquote>

            <p className="text-sm text-muted-foreground" data-testid="text-burn-dialog-description">
              They will never know it was you.
            </p>

            <Textarea
              placeholder="Leave it on their doorstep."
              value={message}
              onChange={(e) => handleChange(e.target.value)}
              className="resize-none min-h-[120px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              data-testid="input-burn-message"
              autoFocus
            />
            {trimmed && (
              <p className="text-xs text-destructive" data-testid="text-burn-limit">
                Too long. We kept the first {TEXT_LIMIT} characters. The rest was not taken.
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[11px] tabular-nums tracking-wide",
                  atLimit ? "text-destructive" : remaining < 200 ? "text-primary" : "text-muted-foreground",
                )}
                data-testid="text-burn-count"
              >
                {used} / {TEXT_LIMIT}
              </span>
              <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleClose} data-testid="button-cancel-burn">
                Leave it
              </Button>
              <Button
                onClick={() => {
                  if (!message.trim()) return;
                  onSend(message.trim());
                }}
                disabled={!message.trim() || sending}
                data-testid="button-send-burn"
              >
                <BurningCookieIcon className="h-4 w-4 mr-1.5" isLit />
                {sending ? "Burning..." : "Send the burn"}
              </Button>
              </div>
            </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
