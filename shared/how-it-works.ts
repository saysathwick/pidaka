import { OPERATOR } from "./site";

export type HowItWorksStep = { label: string; title: string; body: string };
export type HowItWorksLink = { href: string; label: string };
export type HowItWorksFaq = { question: string; answer: string; link?: HowItWorksLink };

export const HOW_IT_WORKS = {
  title: "How Pidaka works",
  lede:
    "Pidaka is an anonymous wall for the things you would not sign. You leave a thought, strangers read it, and anyone who feels it can answer you in private. No profiles. No followers. No likes.",
  steps: [
    {
      label: "Discover",
      title: "Read the wall. No account needed.",
      body:
        "Every pidaka on the wall is a thought someone left without their name. Read as much as you like without signing in. Find something that feels like you.",
    },
    {
      label: "Share",
      title: "Leave a pidaka without your name.",
      body:
        "When you want to speak, take a name. Pidaka gives you a private name, something like Ember 4702, that only you see. The wall never shows it. Write up to 3,000 characters and drop it on the wall.",
    },
    {
      label: "Connect",
      title: "Send a burn, a private reply.",
      body:
        "If a pidaka stays with you, send a burn. It goes straight to the author’s inbox. They never learn who you are, and you never learn who they are. That is the point.",
    },
    {
      label: "Let go",
      title: "Gone from the wall in 48 hours.",
      body:
        "Each pidaka leaves the public wall 48 hours after it is shared, and fresh thoughts take its place. The burns you receive stay in your inbox.",
    },
  ] satisfies HowItWorksStep[],
  fairness: {
    title: "No feed. No ranking.",
    body:
      "Pidaka does not decide whose thoughts are worth seeing. Its doorstep agent places every pidaka on every other person’s doorstep: the ones you have not read come first, then the ones about to leave. Nothing is boosted by likes, because there are no likes.",
  },
  faq: [
    {
      question: "Is Pidaka really anonymous?",
      answer:
        "To other people, yes. Nobody on the wall sees your private Pidaka name, your phone number, or your email, and a burn never reveals who sent it. Pidaka itself keeps limited account and device details so it can stop abuse and meet its legal duties. The privacy policy explains exactly what is kept and why.",
      link: { href: "/privacy", label: "Read the privacy policy" },
    },
    {
      question: "Do I need an account to read pidakas?",
      answer:
        "No. Reading the wall is free and needs no sign-in. You only take a name when you want to leave a pidaka or send a burn.",
    },
    {
      question: "How do I take a name?",
      answer:
        "Tap “Drop your mask” and choose one of the doors open on the wall, such as Google, phone, email, or a guest name. A guest name asks for your device location once, to help stop abuse. It is never shown to anyone on the wall.",
    },
    {
      question: "What is a burn?",
      answer:
        "A burn is a private, anonymous reply to a pidaka. It arrives in the author’s Burns inbox and they cannot see who sent it. You cannot burn your own pidaka, and there are no public comments.",
    },
    {
      question: "What happens to a pidaka after 48 hours?",
      answer:
        "It leaves the public wall and is removed. Burns it received stay in the author’s inbox with a short excerpt, so they remember what the reply was answering.",
    },
    {
      question: "Can I see who read my pidaka?",
      answer:
        "No. Pidaka has no likes, no view counts, and no followers. A pass means someone heard you, not that you failed.",
    },
    {
      question: "What is not allowed on the wall?",
      answer:
        "Anything illegal, threats or incitement to violence, sharing another person’s private information, impersonating Pidaka, and any content that sexualises or exploits children. Some pidakas are held for review before they reach the wall, and the keeper can remove anything that breaks the terms.",
      link: { href: "/terms", label: "Read the terms" },
    },
    {
      question: "Is Pidaka free?",
      answer: "Yes. Reading, leaving pidakas, and sending burns are free.",
    },
    {
      question: "How do I delete my account?",
      answer:
        "When you are signed in, open the menu and choose Delete account. You can also follow the steps on the delete account page.",
      link: { href: "/delete-account", label: "Delete account steps" },
    },
    {
      question: "Who makes Pidaka?",
      answer: `Pidaka is made by ${OPERATOR.legalName} in India.`,
      link: { href: "/contact", label: "Contact us" },
    },
  ] satisfies HowItWorksFaq[],
} as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain semantic HTML so crawlers read the page before JavaScript runs. React replaces it on mount. */
export function renderHowItWorksHtml(): string {
  const e = escapeHtml;
  const steps = HOW_IT_WORKS.steps
    .map(
      (step, i) =>
        `<li><h2>${String(i + 1).padStart(2, "0")} ${e(step.label)}: ${e(step.title)}</h2><p>${e(step.body)}</p></li>`,
    )
    .join("");
  const faq = HOW_IT_WORKS.faq
    .map(
      (item) =>
        `<h3>${e(item.question)}</h3><p>${e(item.answer)}${
          item.link ? ` <a href="${e(item.link.href)}">${e(item.link.label)}</a>` : ""
        }</p>`,
    )
    .join("");
  // Inline styles: this shows for a moment before the app's CSS and theme load
  return [
    `<main style="min-height:100vh;background:#070709;color:#e8e2da;font-family:system-ui,sans-serif;line-height:1.7;padding:3rem max(1rem,calc(50vw - 21rem))">`,
    `<h1>${e(HOW_IT_WORKS.title)}</h1>`,
    `<p>${e(HOW_IT_WORKS.lede)}</p>`,
    `<ol>${steps}</ol>`,
    `<h2>${e(HOW_IT_WORKS.fairness.title)}</h2><p>${e(HOW_IT_WORKS.fairness.body)}</p>`,
    `<h2>Questions</h2>${faq}`,
    `<p><a href="/">Read the wall</a></p>`,
    `</main>`,
  ].join("");
}

/** FAQPage structured data built from the same questions shown on the page. */
export function howItWorksFaqSchema() {
  return {
    "@type": "FAQPage",
    mainEntity: HOW_IT_WORKS.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
