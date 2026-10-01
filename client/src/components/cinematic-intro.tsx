import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Flame, Globe2, LockKeyhole, RotateCcw } from "lucide-react";
import { PidakaMark } from "@/components/pidaka-logo";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const INTRO_KEY = "pidaka_intro_seen";
const LAST_VISIT_KEY = "pidaka_last_visit";
/** Returning visitors see the intro again only after being away this long. */
const INTRO_AWAY_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldPlayIntro() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has("intro")) return true;
  if (window.location.pathname !== "/" || params.has("drop") || params.has("token") || params.has("named")) return false;
  try {
    if (sessionStorage.getItem(INTRO_KEY) === "1") return false;
    const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY));
    return !lastVisit || Date.now() - lastVisit > INTRO_AWAY_MS;
  } catch {
    return false;
  }
}
export function recordVisit() {
  try { localStorage.setItem(LAST_VISIT_KEY, String(Date.now())); } catch { /* Browsing works without storage. */ }
}
export function markIntroSeen() {
  try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* Browsing works without storage. */ }
  recordVisit();
}
const samples = [
  "Somewhere between who I was and who I’m becoming, I’m learning to be here.",
  "Today’s small win: I finally did the thing I kept putting off.",
  "Does anyone else take the long way home just to finish a song?",
];
const chapters = [
  { label: "Discover", eyebrow: "01 / A wall of unfiltered thoughts", title: "Less performance.", accent: "More human.", body: "A pidaka is a thought shared on a public wall. No public identity attached. Read a little. Find something that feels like you.", hint: "No account needed to explore.", icon: Globe2 },
  { label: "Connect", eyebrow: "02 / A private spark", title: "Something resonate?", accent: "Send a burn.", body: "A burn is a private response to a pidaka. It goes to the author’s inbox, without revealing your identity to them. Sign in when you’re ready to post or respond.", hint: "Public thoughts. Private responses.", icon: LockKeyhole },
  { label: "Let go", eyebrow: "03 / Here for a moment", title: "Make room for", accent: "what comes next.", body: "Pidakas leave the public wall after 48 hours. Fresh thoughts take their place. Your inbox holds the responses you receive, even after a post leaves the wall.", hint: "Anonymous to other users. Shared with care.", icon: Flame },
];

export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [sample, setSample] = useState(0);
  const [response, setResponse] = useState("");
  const [hours, setHours] = useState(12);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const chapter = chapters[step];
  const Icon = chapter.icon;
  const finish = () => { markIntroSeen(); onComplete(); };
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
  }, [step]);
  return (
    <div className="intro-experience" data-testid="cinematic-intro">
      <div className="intro-orbit intro-orbit-one" aria-hidden="true" />
      <div className="intro-orbit intro-orbit-two" aria-hidden="true" />
      <header className="intro-header">
        <div className="flex items-center gap-3"><PidakaMark className="h-9 w-9" /><span className="font-serif text-lg tracking-[0.24em]">PIDAKA</span></div>
        <button className="intro-text-button" onClick={finish}>Explore the wall <ArrowRight size={16} /></button>
      </header>
      <main className="intro-main">
        <div className="intro-story">
          <nav aria-label="Introduction chapters" className="intro-chapters">
            {chapters.map((item, i) => <button key={item.label} onClick={() => setStep(i)} aria-current={step === i ? "step" : undefined}><span>{String(i + 1).padStart(2, "0")}</span>{item.label}</button>)}
          </nav>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .25 }}>
              <p className="intro-eyebrow">{chapter.eyebrow}</p>
              <h1 ref={heading} tabIndex={-1} className="intro-title">{chapter.title}<br /><em>{chapter.accent}</em></h1>
              <p className="intro-description">{chapter.body}</p>
              <p className="intro-assurance"><Icon size={15} />{chapter.hint}</p>
            </motion.div>
          </AnimatePresence>
          <div className="intro-actions">
            <button className="intro-primary" onClick={step === 2 ? finish : () => setStep(step + 1)}>{step === 2 ? "Explore pidakas" : step === 0 ? "Show me how it works" : "What happens next?"}<ArrowRight size={18} /></button>
            {step > 0 && <button className="intro-text-button" onClick={() => setStep(step - 1)}><ArrowLeft size={15} />Back</button>}
          </div>
        </div>
        <section className="intro-stage" aria-label="Interactive product preview">
          <div className="intro-stage-label"><span className="intro-dot" />{step === 0 ? "THE PUBLIC WALL" : step === 1 ? "A PRIVATE CONNECTION" : "A LITTLE SPACE TO LET GO"}<span className="intro-demo-label">DEMO</span></div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} className="intro-demo" initial={{ opacity: 0, scale: reduced ? 1 : .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .3 }}>
              <div className="intro-card-stack">
                <div className="intro-card-behind" aria-hidden="true" />
                <motion.article className="intro-preview-card" animate={{ opacity: step === 2 && hours === 48 ? .35 : 1, y: step === 2 && hours === 48 && !reduced ? -8 : 0 }}>
                  <div className="flex items-center justify-between gap-3"><span className="intro-card-category">A THOUGHT, SHARED</span><Flame size={19} className="text-[#e9a477]" /></div>
                  <AnimatePresence mode="wait" initial={false}><motion.p key={sample} className="intro-sample" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .15 }}>{samples[sample]}</motion.p></AnimatePresence>
                  <div className="intro-card-footer"><span>No public identity</span><span>{step === 2 ? hours === 48 ? "Left the wall" : `${48 - hours}h left` : "36h left"}</span></div>
                </motion.article>
              </div>
              {step === 0 && <div className="intro-demo-controls"><button className="intro-outline" onClick={() => setSample((sample + 1) % samples.length)}>Another thought <ArrowRight size={16} /></button><p>Try it. There’s more than one way to feel.</p></div>}
              {step === 1 && <div className="intro-response-area"><p className="intro-control-label">TRY A RESPONSE</p><div className="flex flex-wrap gap-2">{["I feel this, too.", "Needed this today."].map(text => <button className="intro-response" aria-pressed={response === text} key={text} onClick={() => setResponse(text)}>{text}</button>)}</div><div className="intro-response-result" aria-live="polite">{response ? <motion.div initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3"><Check size={18} className="shrink-0 text-[#e9a477]" /><span>“{response}”<small>Preview: this would arrive in the author’s inbox.</small></span></motion.div> : <span>Choose a response to see the connection.</span>}</div></div>}
              {step === 2 && <div className="intro-time"><div className="flex items-center justify-between"><label htmlFor="intro-hours" className="intro-control-label">MOVE THROUGH TIME</label><button className="intro-text-button" onClick={() => setHours(0)} aria-label="Reset the time preview"><RotateCcw size={15} /></button></div><input id="intro-hours" type="range" min="0" max="48" value={hours} onChange={e => setHours(Number(e.target.value))} aria-valuetext={`${hours} hours elapsed, ${48 - hours} hours remaining`} /><div className="flex justify-between text-xs text-[#a49a90]"><span>Just shared</span><span>48 hours</span></div><p aria-live="polite">{hours === 48 ? "Off the public wall. Responses and excerpts can remain in inboxes." : `${hours} hours in. A moment shared, with room to move on.`}</p></div>}
            </motion.div>
          </AnimatePresence>
          <p className="intro-preview-note">Illustrative preview. Nothing here is posted or sent.</p>
        </section>
      </main>
      <footer className="intro-footer"><span>A little less noise. A little more you.</span><a href="/privacy">Your privacy matters <ArrowRight size={13} /></a></footer>
    </div>
  );
}
