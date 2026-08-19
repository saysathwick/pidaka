import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export const COMPOSER_PROMPTS = [
  "Say it. It dies in 48 hours.",
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
}

export function PidakaComposer({
  value,
  pending,
  isGuest,
  onChange,
  onSubmit,
  onGuestClick,
}: PidakaComposerProps) {
  const [promptIndex, setPromptIndex] = useState(0);

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
        className="group w-full text-left rounded-xl border border-border/70 bg-card/90 px-5 py-5 hover-elevate"
        data-testid="button-guest-composer"
      >
        <p className="font-serif text-xl sm:text-2xl tracking-tight">
          {COMPOSER_PROMPTS[promptIndex]}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Drop your mask to post. Reading is free.
        </p>
      </button>
    );
  }

  const used = value.length / 500;

  return (
    <Card className="overflow-hidden border-border/70 bg-card/95 backdrop-blur-xl">
      <CardContent className="pt-4 pb-4 flex flex-col gap-3">
        <Textarea
          placeholder={COMPOSER_PROMPTS[promptIndex]}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 500))}
          className="resize-none text-sm min-h-[84px] border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30"
          data-testid="input-pidaka-content"
        />
        <div className="h-[2px] w-full rounded-full bg-border overflow-hidden" aria-hidden>
          <div
            className="h-full bg-primary/80 rounded-full transition-[width] duration-200"
            style={{ width: `${Math.max((1 - used) * 100, 0)}%` }}
          />
        </div>
        <div className="flex items-center justify-end">
          <Button
            onClick={onSubmit}
            disabled={!value.trim() || pending}
            data-testid="button-post-pidaka"
          >
            <Send className="h-4 w-4 mr-1.5" />
            {pending ? "Dropping..." : "Drop it on the wall"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
