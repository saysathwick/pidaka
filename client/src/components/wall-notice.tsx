import { Download, ExternalLink } from "lucide-react";
import {
  noticeLinkIsFile,
  type NoticeColor,
  type NoticeFont,
  type NoticeLink,
  type NoticeSize,
  type NoticeStyle,
} from "@shared/wall";
import { cn } from "@/lib/utils";

const FONT_CLASS: Record<NoticeFont, string> = {
  sans: "notice-font-sans",
  serif: "notice-font-serif",
  mono: "notice-font-mono",
};

const SIZE_CLASS: Record<NoticeSize, string> = {
  sm: "notice-size-sm",
  md: "notice-size-md",
  lg: "notice-size-lg",
  xl: "notice-size-xl",
};

const COLOR_CLASS: Record<NoticeColor, string> = {
  muted: "notice-color-muted",
  ember: "notice-color-ember",
  snow: "notice-color-snow",
  copper: "notice-color-copper",
  ochre: "notice-color-ochre",
  wine: "notice-color-wine",
  indigo: "notice-color-indigo",
  blue: "notice-color-blue",
};

export function WallNotice({
  title = "",
  notice,
  links,
  style = "still",
  font = "sans",
  size = "md",
  color = "muted",
  className,
}: {
  title?: string;
  notice: string;
  links: NoticeLink[];
  style?: NoticeStyle;
  font?: NoticeFont;
  size?: NoticeSize;
  color?: NoticeColor;
  className?: string;
}) {
  const header = title.trim();
  const body = notice.trim();
  if (!header && !body && links.length === 0) return null;

  return (
    <div
      className={cn(
        "w-full min-w-0 flex flex-col gap-1 rounded-xl border border-border/60 bg-card/40 px-4 py-4 backdrop-blur-sm text-center sm:text-left leading-relaxed",
        className,
      )}
    >
      {header ? (
        <p
          data-testid="text-wall-notice-title"
          className={cn(
            "font-serif text-lg tracking-wide text-foreground",
            color !== "muted" && COLOR_CLASS[color],
            style === "blink" && "notice-blink",
            style === "pulse" && "notice-pulse",
          )}
        >
          {header}
        </p>
      ) : null}
      {body ? (
        <NoticeCopy text={body} style={style} font={font} size={size} color={color} />
      ) : null}
      {links.length > 0 ? (
        <ul className={cn("flex flex-col gap-2", (header || body) && "mt-2")}>
          {links.map((link, index) => {
            const file = noticeLinkIsFile(link);
            return (
              <li key={`${link.href}-${index}`}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline underline-offset-4 dark:text-blue-400"
                  data-testid={`link-wall-notice-${index}`}
                >
                  {file ? (
                    <Download className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span>{link.name}</span>
                  {file ? <span className="sr-only"> (download)</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function NoticeCopy({
  text,
  style,
  font,
  size,
  color,
}: {
  text: string;
  style: NoticeStyle;
  font: NoticeFont;
  size: NoticeSize;
  color: NoticeColor;
}) {
  // Greeting body default: muted small type. Hearth overrides still apply when not default.
  const look = cn(
    size === "md" ? "text-sm" : SIZE_CLASS[size],
    font === "sans" ? null : FONT_CLASS[font],
    COLOR_CLASS[color],
  );

  if (style === "scroll") {
    return (
      <div className={cn("notice-scroll", look)} data-testid="text-wall-notice">
        <p className="notice-scroll-track">
          <span>{text}</span>
          <span aria-hidden>{text}</span>
        </p>
      </div>
    );
  }

  return (
    <p
      data-testid="text-wall-notice"
      className={cn(
        look,
        style === "blink" && "notice-blink",
        style === "pulse" && "notice-pulse",
      )}
    >
      {text}
    </p>
  );
}
