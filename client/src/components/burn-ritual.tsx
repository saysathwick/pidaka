import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import type { PidakaItem } from "@/components/pidaka-card";

interface BurnRitualProps {
  pidaka: PidakaItem | null;
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function BurnRitual({ pidaka, open, sending, onClose, onSend }: BurnRitualProps) {
  const [message, setMessage] = useState("");

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
            className="absolute inset-0 bg-black/80"
            aria-label="Close burn"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-labelledby="burn-ritual-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg sm:mx-4 rounded-t-2xl sm:rounded-2xl border border-border/50 bg-background p-6 pb-8 flex flex-col gap-5"
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

            <blockquote className="font-serif text-[17px] leading-relaxed text-muted-foreground border-l border-primary/40 pl-4">
              {pidaka.content}
            </blockquote>

            <p className="text-sm text-muted-foreground" data-testid="text-burn-dialog-description">
              They will never know it was you.
            </p>

            <Textarea
              placeholder="Leave it on their doorstep."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              className="resize-none min-h-[120px] border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30"
              data-testid="input-burn-message"
              autoFocus
            />

            <div className="flex items-center justify-between gap-2">
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
