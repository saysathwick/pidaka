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
            or a phone number if you use that door, or a guest key if you continue
            as a guest. We assign an anonymous name.
          </li>
          <li>
            <span className="font-medium text-foreground">Guest location.</span> If
            you continue as a guest, we ask the phone or browser for{" "}
            <span className="font-medium text-foreground">location permission</span>.
            Only if you allow it do we store an approximate location (coordinates and
            accuracy when the device can provide them). We use that provenance so
            keepers can identify or reach you if a message is anti-social or harmful,
            or if someone may need help. It is kept in a private keeper vault. It is
            not shown to other people on the wall. If you refuse permission, you can
            still read the wall, but we will not give you a guest name to paste or burn.
          </li>
          <li>
            <span className="font-medium text-foreground">Device.</span> When you
            take a name (guest, Google, Apple, or other doors that send it), we may
            store coarse device details: platform, language, timezone, screen and
            window size, whether the screen is touch, browser name and version,
            operating system and version, processor cores and approximate memory
            where the browser reports them, and the user agent. On a phone browser
            that reports it, and always on the Android or iOS app, we also store
            the device brand and model; the app adds its own version, the system
            WebView version, and whether it is running on an emulator. This helps
            stop abuse and keep the wall. It is not a public profile.
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
            read it. The Android app may also keep a session token on the device.
          </li>
          <li>
            <span className="font-medium text-foreground">Burn alerts.</span> If
            you allow notifications, this device’s push address so we can tell you
            a burn arrived. The notice does not contain the burn or your pidaka.
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
          advertising pixels on the wall. Device brand and model are not shared with
          other users.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          To name you, to show the wall, to deliver pidakas to other people, to
          carry burns to the right inbox, to tell a device you allowed that a burn
          arrived, and to keep you signed in. Guest location, together with device
          details, is reviewed only in a private keeper vault so we can respond to
          anti-social or harmful messages, or cases where someone may need help —
          not for advertising or public profiles. We do not use wall text to train
          public models.
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
          in, a host and database to run the app, and — only if you turn on burn
          alerts — the browser’s push service to deliver that notice. Those
          processors see what they need to do that job. The alert itself does not
          include the burn text. We do not sell your account or your pidakas.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Pidakas are not an archive. We remove them, and the burns attached to
          them, after a short time. Accounts, anonymous names, sign-in details,
          location provenance, and device details remain until you ask us to delete
          them, or until we close the service.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can leave the wall from the header. That also drops burn alerts for
          this device. You can refuse notifications in the browser. Write to{" "}
          {OPERATOR.email} to delete your account and the pidakas still tied to it,
          or use{" "}
          <Link href="/delete-account" className="underline underline-offset-4">
            Delete account
          </Link>
          . We will say when it is done. Some records may remain for a short time in
          backups or where the law requires it.
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
          Use this for a report or a legal notice. To delete your account, use{" "}
          <Link href="/delete-account" className="underline underline-offset-4">
            Delete account
          </Link>
          . We aim to reply within fifteen days.
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

export function DeleteAccountCopy() {
  const mail = `mailto:${OPERATOR.email}?subject=${encodeURIComponent("Pidaka account deletion request")}`;
  return (
    <>
      <LegalSection title="How to delete">
        <p>
          Sign in, open the menu, and choose Delete account. Your account will be
          permanently deleted once the keepers approve the request.
        </p>
        <p>
          You can also email us from the address or phone you used to sign in (or
          include your anonymous name if you only used guest):
        </p>
        <p>
          <a className="underline underline-offset-4" href={mail}>
            {OPERATOR.email}
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          Subject line: “Pidaka account deletion request”. We aim to complete
          deletion within fifteen days and will confirm when it is done.
        </p>
      </LegalSection>

      <LegalSection title="Deactivate">
        <p>
          From the same menu you can request deactivate. Your account is archived
          instead of wiped. Sign in again later to ask the keepers to reactivate it.
        </p>
      </LegalSection>

      <LegalSection title="What we remove">
        <p>
          Your account, anonymous name, sign-in details, guest provenance we
          stored, push tokens for your devices, and pidakas still tied to your
          account when delete is approved. Burns attached to those pidakas go with
          them.
        </p>
      </LegalSection>

      <LegalSection title="What may remain briefly">
        <p>
          Some records may remain for a short time in backups, or where the law
          requires us to keep them. They are not used to put you back on the wall.
        </p>
      </LegalSection>
    </>
  );
}

export function ChildSafetyCopy() {
  const reportMail = `mailto:${OPERATOR.email}?subject=${encodeURIComponent("Pidaka child safety / CSAE report")}`;
  return (
    <>
      <LegalSection title="Scope">
        <p>
          These standards apply to <span className="font-medium text-foreground">Pidaka</span>,
          the anonymous wall app and website operated by{" "}
          {OPERATOR.legalName} (“Phito”). They state our zero-tolerance position
          on child sexual abuse and exploitation (CSAE), including child sexual
          abuse material (CSAM).
        </p>
      </LegalSection>

      <LegalSection title="Age">
        <p>
          Pidaka is for adults only. You must be at least 18 to create an account,
          paste, or burn. We do not knowingly allow children to use the service.
        </p>
      </LegalSection>

      <LegalSection title="What we prohibit">
        <p>Users may not create, upload, share, request, or distribute content that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Sexually exploits, abuses, or endangers a child</li>
          <li>Contains or links to CSAM</li>
          <li>Grooms, solicits, or traffics a child for sexual purposes</li>
          <li>Otherwise facilitates CSAE</li>
        </ul>
        <p>
          This ban is absolute. It is also written into our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="How to report">
        <p>
          If you see content or behaviour on Pidaka that may involve CSAE or CSAM,
          report it immediately to:
        </p>
        <p>
          <a className="underline underline-offset-4" href={reportMail}>
            {OPERATOR.email}
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          Include the anonymous name if you have one, the time, and any text you
          can safely quote. Do not forward illegal images. You may also use{" "}
          <Link href="/contact" className="underline underline-offset-4">
            Contact
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="What we do when we know">
        <p>
          When we obtain actual knowledge of CSAM or CSAE on Pidaka, we take
          appropriate action without delay. That includes removing the content,
          restricting or deleting the account, and preserving records needed for a
          lawful report.
        </p>
      </LegalSection>

      <LegalSection title="Law and authorities">
        <p>
          We comply with applicable child-safety laws. Where we confirm CSAM, we
          report it to the relevant authority — including India’s cybercrime /
          child-protection channels as required, and, where applicable, the
          National Center for Missing &amp; Exploited Children (NCMEC) or the
          equivalent body for the jurisdiction involved.
        </p>
      </LegalSection>

      <LegalSection title="Child safety contact">
        <p>
          For notifications from Google Play or other platforms about CSAE on
          Pidaka, contact:
        </p>
        <p>
          {OPERATOR.legalName}
          <br />
          <a className="underline underline-offset-4" href={`mailto:${OPERATOR.email}`}>
            {OPERATOR.email}
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          This mailbox is monitored for child-safety matters and can act on
          enforcement and review.
        </p>
      </LegalSection>
    </>
  );
}
