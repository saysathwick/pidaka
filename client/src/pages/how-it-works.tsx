import { Link } from "wouter";
import { ArrowRight, ChevronDown } from "lucide-react";
import { HOW_IT_WORKS } from "@shared/how-it-works";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export default function HowItWorksPage() {
  return (
    <SiteShell place="legal">
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-10 sm:pb-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Pidaka</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">{HOW_IT_WORKS.title}</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">{HOW_IT_WORKS.lede}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="h-11 rounded-full px-5" data-testid="button-how-read-wall">
            <Link href="/">
              Read the wall <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-full px-5" data-testid="button-how-intro">
            <Link href="/intro">Take the interactive tour</Link>
          </Button>
        </div>

        <ol className="mt-14 flex flex-col gap-4">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <li key={step.label} className="composer-glass rounded-xl border px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary">
                {String(i + 1).padStart(2, "0")} / {step.label}
              </p>
              <h2 className="mt-2 font-serif text-2xl tracking-tight">{step.title}</h2>
              <p className="mt-3 text-[15px] leading-7 text-foreground/85">{step.body}</p>
            </li>
          ))}
        </ol>

        <section className="mt-16 border-t border-border/60 pt-12">
          <h2 className="font-serif text-3xl tracking-tight">{HOW_IT_WORKS.fairness.title}</h2>
          <p className="mt-4 text-[15px] leading-7 text-foreground/85">{HOW_IT_WORKS.fairness.body}</p>
        </section>

        <section className="mt-16 border-t border-border/60 pt-12" aria-labelledby="how-faq">
          <h2 id="how-faq" className="font-serif text-3xl tracking-tight">Questions</h2>
          <div className="mt-6 flex flex-col divide-y divide-border/60 border-y border-border/60">
            {HOW_IT_WORKS.faq.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
                  <h3>{item.question}</h3>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[15px] leading-7 text-foreground/80">
                  {item.answer}
                  {item.link ? (
                    <>
                      {" "}
                      <Link href={item.link.href} className="underline underline-offset-4 hover:text-foreground">
                        {item.link.label}
                      </Link>
                    </>
                  ) : null}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-col items-start gap-3">
          <p className="font-serif text-2xl">Say it to the wall. Not them.</p>
          <Button asChild className="h-11 rounded-full px-5">
            <Link href="/">
              Go to the wall <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </SiteShell>
  );
}
