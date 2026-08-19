import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background wall-atmosphere px-4">
      <div className="text-center flex flex-col items-center gap-4 max-w-sm">
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Lost</p>
        <h1 className="font-serif text-3xl">This room does not exist</h1>
        <p className="text-sm text-muted-foreground">
          The wall is still here.
        </p>
        <Button onClick={() => navigate("/")} data-testid="button-go-home">
          Back to the wall
        </Button>
      </div>
    </div>
  );
}
