import { Button } from "@/components/ui/button";
import { useBurnAlerts } from "@/lib/burn-alerts";

export function BurnAlertPrompt() {
  const { prompt, busy, enable, skip } = useBurnAlerts();
  if (!prompt) return null;

  return (
    <div className="border-b border-border/60 bg-card/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground" data-testid="text-burn-alert-prompt">
          Hear when a burn lands on this device? The notice will not quote it.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={skip}
            data-testid="button-burn-alert-skip"
          >
            Not now
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => void enable()}
            data-testid="button-burn-alert-enable"
          >
            {busy ? "Waiting..." : "Hear them"}
          </Button>
        </div>
      </div>
    </div>
  );
}
