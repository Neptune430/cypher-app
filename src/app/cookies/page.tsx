import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Cookie Policy | CYPHER",
};

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="July 19, 2026">
      <p>
        This page explains CYPHER&apos;s actual use of cookies and similar storage. We would rather
        tell you plainly that we do very little here than pad this page out to look more official
        than it needs to be.
      </p>

      <h2>What CYPHER itself uses</h2>
      <p>
        CYPHER does not use advertising cookies, tracking cookies, or third party analytics cookies.
        The only thing stored in your browser is a single local preference remembering that you have
        accepted (or not) our Privacy Policy and these terms, so you are not asked again on every
        visit. This is stored using your browser&apos;s local storage, not a traditional cookie, and it
        never leaves your device.
      </p>

      <h2>What our hosting provider may do</h2>
      <p>
        Our hosting provider, Vercel, may set minimal technical cookies or use similar mechanisms as
        a normal part of securely serving the site. These are outside CYPHER&apos;s direct control and
        are not used by us for tracking or advertising.
      </p>

      <h2>No third party trackers</h2>
      <p>
        We do not use Google Analytics, advertising pixels, or any other third party tracking script
        on this site.
      </p>

      <h2>Managing your local preference</h2>
      <p>
        You can clear the stored acceptance preference at any time through your browser&apos;s site data
        or local storage settings, which will show you the consent prompt again on your next visit.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If CYPHER&apos;s use of cookies or local storage changes in the future, this page will be updated
        and the date above will reflect that.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a href="mailto:info.cyph3r@gmail.com" className="font-semibold">our support email</a>.
      </p>
    </LegalLayout>
  );
}
