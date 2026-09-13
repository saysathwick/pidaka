import {
  SITE_NAME,
  SITE_TAGLINE_ACCENT,
  SITE_TAGLINE_LEAD,
} from "@shared/site";
import { cn } from "@/lib/utils";

export type PidakaLogoProps = {
  className?: string;
  isLit?: boolean;
  markLit?: boolean;
  variant?: "default" | "hero";
  useImage?: boolean;
  onDark?: boolean;
};

function MarkSvg({ isLit, className }: { isLit?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="pidaka-cake" x1="12%" y1="8%" x2="88%" y2="92%">
          <stop offset="0%" stopColor="#5a3a22" />
          <stop offset="42%" stopColor="#3d2414" />
          <stop offset="72%" stopColor="#29170c" />
          <stop offset="100%" stopColor="#170d07" />
        </linearGradient>
        <radialGradient id="pidaka-ember" cx="48%" cy="46%" r="42%">
          <stop offset="0%" stopColor="#c45c26" stopOpacity={isLit ? 0.85 : 0.35} />
          <stop offset="100%" stopColor="#c45c26" stopOpacity="0" />
        </radialGradient>
        <filter id="pidaka-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0.12" />
        </filter>
        <clipPath id="pidaka-disc">
          <ellipse cx="16" cy="16.2" rx="14.4" ry="13.7" />
        </clipPath>
      </defs>
      <g clipPath="url(#pidaka-disc)">
        <rect width="32" height="32" fill="url(#pidaka-cake)" />
        <rect width="32" height="32" filter="url(#pidaka-noise)" opacity="0.35" />
        <ellipse cx="16" cy="12.2" rx="10" ry="6" fill="#734b30" opacity="0.28" />
        <ellipse cx="16" cy="21.4" rx="11" ry="5" fill="#000" opacity="0.32" />
        <ellipse cx="16" cy="16" rx="7.4" ry="7.4" fill="url(#pidaka-ember)" />
      </g>
      {isLit && (
        <ellipse
          cx="16"
          cy="16"
          rx="10"
          ry="10"
          className="fill-primary/15 blur-[2px] ember-breathe"
        />
      )}
    </svg>
  );
}

export function PidakaMark({
  className,
  isLit = false,
  variant = "default",
}: PidakaLogoProps) {
  const sizeClass = variant === "hero" ? "h-24 w-24" : "h-8 w-8";
  return (
    <span className={cn("inline-flex items-center justify-center", className)} aria-hidden>
      <MarkSvg isLit={isLit} className={cn(sizeClass, className?.includes("h-") ? "h-full w-full" : undefined)} />
    </span>
  );
}

export function PidakaWordmark({ className, onDark }: PidakaLogoProps) {
  return (
    <span
      className={cn(
        "font-serif text-xl tracking-[0.22em] uppercase",
        onDark ? "text-[#d4c4a8]" : "text-[#3d2a1a] dark:text-[#d4c4a8]",
        className,
      )}
    >
      {SITE_NAME}
    </span>
  );
}

export function PidakaDomain({ className, onDark }: PidakaLogoProps) {
  return (
    <span
      className={cn(
        "font-serif text-xs tracking-wide",
        onDark ? "text-[#a89078]" : "text-[#6b5340] dark:text-[#a89078]",
        className,
      )}
    >
      pidaka.in
    </span>
  );
}

export function PidakaTagline({ className, onDark }: PidakaLogoProps) {
  return (
    <p className={cn("text-sm leading-relaxed", onDark ? "text-foreground/80" : "text-muted-foreground", className)}>
      <span>{SITE_TAGLINE_LEAD} </span>
      <span className={onDark ? "text-primary" : "text-primary/90"}>{SITE_TAGLINE_ACCENT}</span>
    </p>
  );
}

export function PidakaBrandLockup({
  className,
  markLit = true,
  useImage = true,
  onDark,
}: PidakaLogoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <PidakaMark isLit={markLit} className="h-14 w-14" useImage={useImage} />
      <PidakaWordmark onDark={onDark} />
      <PidakaDomain onDark={onDark} />
      <PidakaTagline onDark={onDark} className="max-w-[240px] text-center" />
    </div>
  );
}

export const CowDungCake = PidakaMark;
export const BurningCookieIcon = PidakaMark;

export default PidakaMark;
