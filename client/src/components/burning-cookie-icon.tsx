import { useId } from "react";
import { cn } from "@/lib/utils";

const CAKE_RADIUS = "48% 52% 47% 53% / 53% 46% 54% 47%";

export interface CowDungCakeProps {
  size?: number;
  className?: string;
  isLit?: boolean;
  /** @deprecated use isLit */
  burning?: boolean;
  /**
   * `hero` — full 3D cake with finger presses and straw (intro / auth).
   * `mark` — compact disc for headers and buttons.
   */
  variant?: "hero" | "mark";
}

export function CowDungCake({
  size,
  className = "",
  isLit,
  burning,
  variant = "mark",
}: CowDungCakeProps) {
  const lit = isLit ?? burning ?? false;
  const filterId = `dung-noise-${useId().replace(/:/g, "")}`;
  const hero = variant === "hero";

  return (
    <div
      className={cn("relative shrink-0 select-none", className)}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden
    >
      {hero && (
        <div className="absolute inset-x-[6%] -bottom-[8%] h-[16%] rounded-full bg-black/45 blur-lg" />
      )}

      <div
        className="absolute inset-0 overflow-hidden transition-[box-shadow] duration-500"
        style={{
          borderRadius: CAKE_RADIUS,
          background: "linear-gradient(145deg, #5a3a22 0%, #3d2414 42%, #29170c 72%, #170d07 100%)",
          boxShadow: lit
            ? "0 0 28px 6px rgba(234, 88, 12, 0.4), inset 0 3px 10px rgba(251, 146, 60, 0.35)"
            : hero
              ? "inset 0 -8px 16px rgba(0, 0, 0, 0.55), inset 0 4px 10px rgba(115, 75, 48, 0.35)"
              : "inset 0 -3px 6px rgba(0, 0, 0, 0.45), inset 0 2px 4px rgba(115, 75, 48, 0.3)",
        }}
      >
        <svg className="h-full w-full opacity-55 mix-blend-overlay" aria-hidden>
          <filter id={filterId}>
            <feTurbulence type="fractalNoise" baseFrequency={hero ? "0.75" : "0.9"} numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0.12" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${filterId})`} />
        </svg>

        {hero && (
          <>
            <div className="absolute inset-0 flex items-center justify-center gap-[7%] opacity-80">
              <span className="h-[42%] w-[9%] rounded-full bg-[#1f1008]/80 blur-[2px] -rotate-12 shadow-inner" />
              <span className="h-[52%] w-[11%] rounded-full bg-[#1a0c06]/85 blur-[2px] rotate-2 shadow-inner" />
              <span className="h-[40%] w-[9%] rounded-full bg-[#1f1008]/80 blur-[2px] rotate-12 shadow-inner" />
            </div>
            <span className="absolute top-[22%] left-[18%] h-[3%] w-[18%] rotate-45 rounded-sm bg-amber-200/45 blur-[0.4px]" />
            <span className="absolute top-[62%] right-[22%] h-[3%] w-[22%] -rotate-12 rounded-full bg-yellow-700/40 blur-[0.3px]" />
            <span className="absolute bottom-[30%] left-[30%] h-[2%] w-[14%] rotate-[70deg] rounded-full bg-amber-100/50" />
            <span className="absolute top-[48%] right-[30%] h-[3%] w-[16%] rotate-[25deg] rounded-full bg-amber-800/45" />
          </>
        )}

        {lit && hero && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[42%] w-[42%] rounded-full bg-orange-600/55 blur-md animate-pulse motion-reduce:animate-none" />
            <div className="absolute h-[22%] w-[22%] rounded-full bg-yellow-400/70 blur-sm animate-ping motion-reduce:animate-none" />
          </div>
        )}
        {lit && !hero && (
          <div className="absolute inset-[20%] rounded-full bg-orange-600/50 blur-[2px]" />
        )}
      </div>
    </div>
  );
}

export function PidakaMark({
  className = "h-5 w-5",
  burning,
  isLit,
  variant = "mark",
  size,
}: CowDungCakeProps) {
  return (
    <CowDungCake
      className={className}
      size={size}
      variant={variant}
      isLit={isLit ?? burning ?? false}
    />
  );
}

export function BurningCookieIcon(props: CowDungCakeProps) {
  return <PidakaMark {...props} />;
}

export default CowDungCake;
