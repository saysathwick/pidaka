import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { SiteShell } from "@/components/site-shell";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <SiteShell place="legal">
      <div className="flex min-h-[70vh] w-full items-center justify-center px-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Lost</p>
          <h1 className="font-serif text-3xl">This room does not exist</h1>
          <p className="text-sm text-muted-foreground">The wall is still here.</p>
          <Button onClick={() => navigate("/")} data-testid="button-go-home">
            Back to the wall
          </Button>
        </div>
      </div>
    </SiteShell>
  );
}
