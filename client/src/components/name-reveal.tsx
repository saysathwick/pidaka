import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface NameRevealProps {
  name: string;
  onComplete: () => void;
}

export function NameReveal({ name, onComplete }: NameRevealProps) {
  const reduced = usePrefersReducedMotion();
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onComplete, reduced ? 0 : 380);
  };

  useEffect(() => {
    const t = window.setTimeout(finish, reduced ? 1600 : 3400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#070709] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.35, ease: "easeIn" }}
      role="dialog"
      aria-label="Your anonymous name"
      data-testid="name-reveal"
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-[0.16]" />
      <div className="pointer-events-none absolute inset-0 intro-vignette" />

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] uppercase tracking-[0.42em] text-muted-foreground"
        >
          We named you
        </motion.p>
        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-5xl md:text-6xl tracking-tight"
          data-testid="text-revealed-name"
        >
          {name}
        </motion.h2>
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: reduced ? 0 : 0.9 }}
          className="max-w-xs text-sm text-muted-foreground leading-relaxed"
        >
          This name is only yours. The wall will never show it.
        </motion.p>
      </div>

      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 right-8 text-[10px] uppercase tracking-[0.35em] text-muted-foreground/80 hover:text-foreground transition-colors"
        data-testid="button-skip-reveal"
      >
        Enter
      </button>
    </motion.div>
  );
}
