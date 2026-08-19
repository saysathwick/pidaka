import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PidakaMark } from "@/components/burning-cookie-icon";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const INTRO_KEY = "pidaka_intro_seen";

export function shouldPlayIntro() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has("intro")) return true;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path !== "/") return false;
  return localStorage.getItem(INTRO_KEY) !== "1";
}

export function markIntroSeen() {
  localStorage.setItem(INTRO_KEY, "1");
}

type Scene = "black" | "paste" | "dry" | "burn" | "mark";

const SCENE_AT: { at: number; scene: Scene }[] = [
  { at: 0, scene: "black" },
  { at: 450, scene: "paste" },
  { at: 1700, scene: "dry" },
  { at: 3000, scene: "burn" },
  { at: 4300, scene: "mark" },
];

const EXIT_AT = 6000;
const SKIP_AFTER = 800;

interface CinematicIntroProps {
  onComplete: () => void;
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const reduced = usePrefersReducedMotion();
  const [scene, setScene] = useState<Scene>(reduced ? "mark" : "black");
  const [canSkip, setCanSkip] = useState(reduced);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    markIntroSeen();
    onComplete();
  };

  const beginExit = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(finish, reduced ? 0 : 420);
  };

  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(beginExit, 2000);
      return () => window.clearTimeout(t);
    }

    const timers = [
      ...SCENE_AT.map(({ at, scene: next }) =>
        window.setTimeout(() => setScene(next), at),
      ),
      window.setTimeout(() => setCanSkip(true), SKIP_AFTER),
      window.setTimeout(beginExit, EXIT_AT),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        beginExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  const line =
    scene === "paste"
      ? "No identity."
      : scene === "dry"
        ? "No followers."
        : scene === "burn"
          ? "Just truth."
          : null;

  const showCake = scene === "paste" || scene === "dry" || scene === "burn" || scene === "mark";
  const showFire = scene === "burn" || scene === "mark";

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070709] text-foreground overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.4, ease: "easeIn" }}
      role="dialog"
      aria-label="Pidaka opening"
      data-testid="cinematic-intro"
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-[0.18]" />
      <div className="pointer-events-none absolute inset-0 intro-vignette" />

      <div className="relative flex flex-col items-center gap-10 px-6 text-center">
        <div className="relative h-[200px] w-[200px] md:h-[240px] md:w-[240px] flex items-center justify-center">
          <AnimatePresence>
            {showCake && (
              <motion.div
                key="cake"
                initial={reduced ? false : { opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative h-full w-full"
              >
                {showFire && (
                  <div className="absolute -inset-10 rounded-full bg-primary/20 blur-3xl ember-breathe" />
                )}
                <PidakaMark
                  variant="hero"
                  isLit={showFire}
                  className="h-full w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="min-h-[5.5rem] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {line && (
              <motion.p
                key={line}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.08 }}
                className="font-serif text-2xl md:text-4xl tracking-[0.18em] text-foreground/90"
                data-testid="intro-line"
              >
                {line}
              </motion.p>
            )}
            {scene === "mark" && (
              <motion.div
                key="mark"
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <h1 className="font-serif text-5xl md:text-7xl tracking-[0.22em] font-medium">
                  PIDAKA
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {canSkip && !leaving && (
        <button
          type="button"
          onClick={beginExit}
          className="absolute bottom-8 right-8 text-[10px] uppercase tracking-[0.35em] text-muted-foreground/80 hover:text-foreground transition-colors"
          data-testid="button-skip-intro"
        >
          Skip
        </button>
      )}
    </motion.div>
  );
}
