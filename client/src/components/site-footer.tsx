import { Link } from "wouter";
import { OPERATOR, SITE_NAME } from "@shared/site";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteFooter({ padded = false }: { padded?: boolean }) {
  return (
    <footer
      className={`border-t border-border/60 bg-background/80 ${padded ? "pb-24 sm:pb-8" : ""} app-shell-footer`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-serif text-sm tracking-[0.18em] uppercase">{SITE_NAME}</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            A product of {OPERATOR.legalName}. India
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs uppercase tracking-[0.16em] text-muted-foreground" aria-label="Legal">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground"
              data-testid={`link-footer-${link.label.toLowerCase()}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
