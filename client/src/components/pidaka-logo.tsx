import {
  SITE_NAME,
  SITE_TAGLINE_ACCENT,
  SITE_TAGLINE_LEAD,
} from "@shared/site";
import { BRAND_MARK } from "@shared/brand-mark";
import { cn } from "@/lib/utils";

export type PidakaLogoProps = {
  className?: string;
  isLit?: boolean;
  markLit?: boolean;
  variant?: "default" | "hero";
  useImage?: boolean;
  onDark?: boolean;
  /** Single colour from currentColor, for small icons on coloured buttons. */
  mono?: boolean;
};

/** Ivory on dark surfaces, charcoal on light ones, as in the brand kit. */
function inkClass(onDark?: boolean) {
  return onDark ? "text-[#FAF6ED]" : "text-[#252525] dark:text-[#FAF6ED]";
}

function MarkSvg({
  isLit,
  onDark,
  mono,
  className,
}: {
  isLit?: boolean;
  onDark?: boolean;
  mono?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox={BRAND_MARK.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", mono ? undefined : inkClass(onDark), className)}
      aria-hidden
    >
      <path fill="currentColor" d={BRAND_MARK.tilePath} />
      <path
        fill={mono ? "currentColor" : BRAND_MARK.coral}
        d={BRAND_MARK.fragmentsPath}
        className={isLit ? "ember-breathe" : undefined}
      />
    </svg>
  );
}

export function PidakaMark({
  className,
  isLit = false,
  onDark,
  mono,
  variant = "default",
}: PidakaLogoProps) {
  const sizeClass = variant === "hero" ? "h-24 w-24" : "h-8 w-8";
  return (
    <span className={cn("inline-flex items-center justify-center", className)} aria-hidden>
      <MarkSvg
        isLit={isLit}
        onDark={onDark}
        mono={mono}
        className={cn(sizeClass, className?.includes("h-") ? "h-full w-full" : undefined)}
      />
    </span>
  );
}

/** Burn (anonymous reply) icon from the brand kit. Small sizes take the surrounding text colour. */
export function BurningCookieIcon({ className, isLit, variant = "default" }: PidakaLogoProps) {
  const { burn } = BRAND_MARK;
  const hero = variant === "hero";
  return (
    <svg
      viewBox={burn.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", hero ? "h-24 w-24 text-[#EF735B]" : "h-8 w-8", className)}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={burn.outlinePath} stroke="currentColor" strokeWidth={burn.strokeWidth} strokeLinejoin="round" />
      <path
        d={burn.facePath}
        fill="currentColor"
        fillRule="evenodd"
        className={hero && isLit ? "ember-breathe" : undefined}
      />
    </svg>
  );
}

export function PidakaWordmark({ className, onDark }: PidakaLogoProps) {
  const { wordmark } = BRAND_MARK;
  return (
    <svg
      viewBox={wordmark.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={SITE_NAME}
      className={cn("h-6 w-auto shrink-0", inkClass(onDark), className)}
    >
      <path
        d={wordmark.path}
        fill="none"
        stroke="currentColor"
        strokeWidth={wordmark.strokeWidth}
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      <circle cx={wordmark.dot.cx} cy={wordmark.dot.cy} r={wordmark.dot.r} fill="currentColor" />
    </svg>
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

export default PidakaMark;
