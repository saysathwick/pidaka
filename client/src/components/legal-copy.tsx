import type { ReactNode } from "react";
import { Link } from "wouter";
import { OPERATOR } from "@shared/site";

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl">{title}</h2>
      {children}
    </section>
  );
}

export function PrivacyCopy() {
  return (
    <>
      <LegalSection title="Who we are">
        <p>
          Pidaka is operated by {OPERATOR.legalName} (“Phito”, “we”), a company
          registered in India.
        </p>
        <p>
          Questions:{" "}
          <a className="underline underline-offset-4" href={`mailto:${OPERATOR.email}`}>
            {OPERATOR.email}
          </a>
          . Office details are under{" "}
          <Link href="/contact" className="underline underline-offset-4">
            Contact
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="What Pidaka is">
        <p>
          Pidaka is an anonymous wall. You receive a name such as Ember 4702. That
          name is shown only to you. Pidakas on the wall are not labelled with it.
          Burns are private replies to the person who wrote a pidaka. The sender is
          not named.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-foreground">Account.</span> Email
            address and a hashed password, or an identifier from Google or Apple,
            or a phone number if you use that door. We assign an anonymous name.
          </li>
          <li>
            <span className="font-medium text-foreground">Wall.</span> The text of
            pidakas you drop, the time they were posted, and burns you send or
            receive (including a short excerpt of the pidaka a burn answers).
          </li>
          <li>
            <span className="font-medium text-foreground">Delivery.</span> A
            viewer token in this browser so we can mark which pidakas this device
            has already seen. That token is not your name.
          </li>
          <li>
            <span className="font-medium text-foreground">Session.</span> An
            HttpOnly cookie so you stay signed in. Scripts in this browser cannot
            read it.
          </li>
          <li>
            <span className="font-medium text-foreground">This device only.</span>{" "}
            Theme and accent choices in local storage. We do not receive those.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="What we do not collect">
        <p>
          We do not ask for a public profile, a display name you choose, followers,
          or a biography. We do not sell lists of who read whom. We do not put
          advertising pixels on the wall.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          To name you, to show the wall, to deliver pidakas to other people, to
          carry burns to the right inbox, to keep you signed in, and to stop abuse
          of the service. We do not use wall text to train public models.
        </p>
      </LegalSection>

      <LegalSection title="How we keep it">
        <p>
          Email, phone, pidaka text, and burns are encrypted at rest (AES-256-GCM)
          in the database. Lookups use a separate blind index, not the raw address
          or number. Passwords are hashed. Phone codes are stored as a digest, not
          the digits. The wall you read is decrypted on the server for that
          request. This is not end-to-end encryption between browsers.
        </p>
      </LegalSection>

      <LegalSection title="Who else sees it">
        <p>
          Strangers see pidaka text without your name. The person you burn sees the
          burn, not you. We may use Google, Apple, or a phone provider to sign you
          in, and a host and database to run the app. Those processors see what
          they need to do that job. We do not sell your account or your pidakas.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Pidakas are not an archive. We remove them, and the burns attached to
          them, after a short time. Accounts, anonymous names, and sign-in details
          remain until you ask us to delete them, or until we close the service.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can leave the wall from the header. Write to {OPERATOR.email} to
          delete your account and the pidakas still tied to it. We will say when it
          is done. Some records may remain for a short time in backups or where the
          law requires it.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>Pidaka is not for anyone under 18.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this policy changes in a way that matters, we will update this page
          and the date above.
        </p>
      </LegalSection>
    </>
  );
}

export function TermsCopy() {
  return (
    <>
      <LegalSection title="The agreement">
        <p>
          These terms are between you and {OPERATOR.legalName} for the Pidaka
          service. If you do not agree, do not use it. By creating an account or
          dropping a pidaka you accept them, and the{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="The wall">
        <p>
          You may read without an account. To paste or to burn you must be named.
          We choose the name. You do not. The wall does not show it. There is no
          public profile and no follower graph. Pass means you heard a pidaka, not
          that it failed.
        </p>
      </LegalSection>

      <LegalSection title="Who may use it">
        <p>
          You must be at least 18. You are responsible for the account on this
          device and for the text you drop.
        </p>
      </LegalSection>

      <LegalSection title="What you may not do">
        <ul className="list-disc space-y-2 pl-5">
          <li>Post anything illegal in India, or that we reasonably believe is illegal elsewhere it is shown.</li>
          <li>Share another person’s private information without a lawful reason.</li>
          <li>Threaten, incite violence, or traffic in child sexual abuse material.</li>
          <li>Impersonate Pidaka or Phito, or try to break the service.</li>
          <li>Scrape the wall for a competing product, or flood it with automated paste.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your text">
        <p>
          You keep whatever rights you have in what you write. You give Phito a
          licence to host it, deliver it to other people on the wall, and store
          burns that quote it, only to run Pidaka. We may remove a pidaka or a burn
          if it breaks these terms or the law. Anonymity on the wall is not a
          promise that we cannot find an account if we are required to.
        </p>
      </LegalSection>

      <LegalSection title="No ranking, no archive">
        <p>
          Pidaka is not a popularity contest. We do not owe you reach, a saved
          history, or an uninterrupted service. The wall may be empty. The
          service may change or close.
        </p>
      </LegalSection>

      <LegalSection title="Our liability">
        <p>
          The wall is provided as it stands. Strangers will write things that are
          untrue, unkind, or unfinished. We are not a publisher of those words in
          the ordinary sense, and we do not warrant that the service is error-free.
          To the extent Indian law allows, Phito is not liable for indirect loss,
          or for what another person writes. Our total liability for a claim about
          Pidaka is limited to one thousand Indian rupees.
        </p>
      </LegalSection>

      <LegalSection title="If we disagree">
        <p>
          Indian law governs these terms. Courts in Hyderabad, Telangana, have
          exclusive jurisdiction, except where the law gives you another mandatory
          forum.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          {OPERATOR.legalName}, {OPERATOR.email}. Details under{" "}
          <Link href="/contact" className="underline underline-offset-4">
            Contact
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}

export function ContactCopy() {
  return (
    <>
      <LegalSection title="Email">
        <p>
          <a className="underline underline-offset-4" href={`mailto:${OPERATOR.email}`}>
            {OPERATOR.email}
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          Use this for account deletion, a report, or a legal notice. We aim to
          reply within fifteen days.
        </p>
      </LegalSection>

      <LegalSection title="Office">
        <address className="not-italic">
          {OPERATOR.legalName}
          <br />
          {OPERATOR.addressLines.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </address>
      </LegalSection>

      <LegalSection title="Phito">
        <p>
          Pidaka is a product of Phito. Company site:{" "}
          <a
            className="underline underline-offset-4"
            href={OPERATOR.website}
            rel="noreferrer"
            target="_blank"
          >
            phito.in
          </a>
          .
        </p>
      </LegalSection>
    </>
  );
}
