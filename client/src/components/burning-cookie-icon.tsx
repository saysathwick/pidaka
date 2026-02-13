interface BurningCookieIconProps {
  className?: string;
}

export function BurningCookieIcon({ className = "h-5 w-5" }: BurningCookieIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2c-.5 1.5-.2 3 .5 4s1 2.5.5 4" />

      <ellipse cx="12" cy="15.5" rx="7" ry="5.5" />

      <circle cx="9.5" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="11" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="17" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
