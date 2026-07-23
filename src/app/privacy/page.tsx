import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Privacy Policy | CYPHER",
};

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="July 19, 2026">
      <p>
        This policy explains what CYPHER collects, why, and what it does not do. It is written in
        plain language on purpose. If anything here is unclear, that is a bug in this page, not a
        reason to guess.
      </p>

      <h2>What we collect</h2>
      <p>When you use CYPHER, the following is processed:</p>
      <ul>
        <li>
          <strong>The four fields you enter:</strong> topic, experience level, available time, and
          learning goal. These are sent to Anthropic&apos;s API to generate your session and are not
          stored in any database on our end.
        </li>
        <li>
          <strong>Your IP address, briefly:</strong> used only to apply a rate limit so the service
          stays usable and cannot be abused at everyone else&apos;s expense. It is held in short-lived
          server memory for this purpose and is not logged permanently or sold.
        </li>
        <li>
          <strong>Standard hosting logs:</strong> our hosting provider, Vercel, may generate
          infrastructure-level logs (like basic request metadata) as a normal part of running any
          website. We do not access these for any purpose beyond troubleshooting the service itself.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <ul>
        <li>No accounts, no sign up, no passwords</li>
        <li>No email addresses</li>
        <li>No payment information</li>
        <li>No advertising or tracking cookies (see our <a href="/cookies">Cookie Policy</a>)</li>
        <li>No sale of any data to any third party, ever</li>
      </ul>

      <h2>How generated sessions work</h2>
      <p>
        Your study session is generated in real time and streamed to your browser. It is not saved
        on any server. If you use the Export PDF or Export Markdown features, that file is created
        entirely in your own browser and downloaded directly to your device, it never passes through
        our servers.
      </p>

      <h2>Third parties involved</h2>
      <p>
        Your four inputs are sent to Anthropic (the maker of Claude) solely to generate your session
        content. Anthropic&apos;s own privacy practices govern how they handle that request. The site
        itself is hosted on Vercel, which provides the underlying infrastructure.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        CYPHER is not directed at children under 13 and we do not knowingly collect information from
        anyone in that age group.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes in any meaningful way, the date at the top of this page will be
        updated.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a href="mailto:info.cyph3r@gmail.com" className="font-semibold">our support email</a>.
      </p>
    </LegalLayout>
  );
}
