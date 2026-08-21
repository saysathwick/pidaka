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
  notice,
  links,
  style = "still",
  font = "sans",
  size = "md",
  color = "muted",
}: {
  notice: string;
  links: NoticeLink[];
  style?: NoticeStyle;
  font?: NoticeFont;
  size?: NoticeSize;
  color?: NoticeColor;
}) {
  const text = notice.trim();
  if (!text && links.length === 0) return null;

  return (
    <div className="w-full min-w-0 flex flex-col gap-3 leading-relaxed border border-border/70 rounded-xl px-4 py-3">
      {text ? (
        <NoticeCopy text={text} style={style} font={font} size={size} color={color} />
      ) : null}
      {links.length > 0 ? (
        <ul className="flex flex-col gap-2">
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
  const look = cn(FONT_CLASS[font], SIZE_CLASS[size], COLOR_CLASS[color]);

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
