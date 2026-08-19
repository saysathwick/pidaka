import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LEGAL_UPDATED, OPERATOR } from "@shared/site";
import { ContactCopy, PrivacyCopy, TermsCopy } from "@/components/legal-copy";
import { SiteShell } from "@/components/site-shell";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "about", href: "/about", label: "About" },
  { id: "privacy", href: "/privacy", label: "Privacy" },
  { id: "terms", href: "/terms", label: "Terms" },
  { id: "contact", href: "/contact", label: "Contact" },
] as const;

function sectionIdFromPath(pathname: string) {
  if (pathname.startsWith("/privacy")) return "privacy";
  if (pathname.startsWith("/terms")) return "terms";
  if (pathname.startsWith("/contact")) return "contact";
  return "about";
}

export default function AboutPage() {
  const [location] = useLocation();
  const active = sectionIdFromPath(location);

  useEffect(() => {
    const node = document.getElementById(active);
    if (!node) return;
    const frame = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  return (
    <SiteShell place="legal">
      <div className="mx-auto w-full max-w-2xl px-4 pb-16">
        <nav
          className="sticky top-16 z-40 -mx-4 mb-10 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl"
          aria-label="About"
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {SECTIONS.map((section) => (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  "hover:text-foreground",
                  active === section.id && "text-foreground",
                )}
                data-testid={`link-about-${section.id}`}
              >
                {section.label}
              </Link>
            ))}
          </div>
        </nav>

        <section id="about" className="scroll-mt-32">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Pidaka</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">About</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            No identity. No followers. Just truth.
          </p>
          <div className="mt-10 flex flex-col gap-8 text-[15px] leading-7 text-foreground/90">
            <p>
              A wall for things you would not sign. You are named in private — Ember
              4702, Soot 1184, something you did not pick. The wall never shows it.
              There are no profiles. Nobody follows anybody. A paste is not a
              performance. It is a confession left for strangers.
            </p>
            <p>Reading is free. Dropping something requires a name, and the name stays yours.</p>
            <div className="flex flex-col gap-3">
              <h2 className="font-serif text-xl">The room</h2>
              <p>
                <span className="font-medium text-foreground">Paste.</span> Say it to
                the wall. Not them.
              </p>
              <p>
                <span className="font-medium text-foreground">Listen.</span> Every
                pidaka is walked to every other door. You do not rank the village.
                Pass means you heard it — not that it failed.
              </p>
              <p>
                <span className="font-medium text-foreground">Burn.</span> An
                anonymous reply to the person who wrote it. They will never know who
                you are. You will never know who they are. That is the point.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="font-serif text-xl">What this is not</h2>
              <p>Not a feed. Not a score. Not a brand you wear in public.</p>
              <p>If you want likes, go where likes live.</p>
            </div>
            <p className="text-sm text-muted-foreground">
              A product of {OPERATOR.legalName}. India
            </p>
          </div>
        </section>

        <AboutBlock id="privacy" kicker="Policy" title="Privacy" lede="The wall does not show who you are. This says what we still have to keep in order to run it.">
          <PrivacyCopy />
        </AboutBlock>
        <AboutBlock id="terms" kicker="House rules" title="Terms" lede="The wall is a room, not a stage.">
          <TermsCopy />
        </AboutBlock>
        <AboutBlock id="contact" kicker="Phito" title="Contact" lede="Write. The wall will not answer. We will.">
          <ContactCopy />
        </AboutBlock>
      </div>
    </SiteShell>
  );
}

function AboutBlock({
  id,
  kicker,
  title,
  lede,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-20 scroll-mt-32 border-t border-border/60 pt-12">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{kicker}</p>
      <h2 className="mt-3 font-serif text-4xl tracking-tight">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{lede}</p>
      <p className="mt-3 text-xs text-muted-foreground">Last updated {LEGAL_UPDATED}</p>
      <div className="mt-10 flex flex-col gap-8 text-[15px] leading-7 text-foreground/90">
        {children}
      </div>
    </section>
  );
}
