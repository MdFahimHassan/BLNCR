import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";

const REPO_URL = "https://github.com/MdFahimHassan/BLNCR";
const CONTACT_EMAIL = "mdfahimhassanbd7@gmail.com";

function H2({ children }) {
  return (
    <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--color-text)]">
      {children}
    </h2>
  );
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="27/09/2026">
      <p>
        These Terms of Service ("Terms") govern your use of BLNCR (the "Service"), a shared-expense
        and bill-splitting application. By creating an account or using the Service, you agree to
        these Terms. If you don't agree, please don't use the Service.
      </p>
      <p>
        BLNCR is an independent, open-source project built and maintained by Md. Fahim Hassan ("we,"
        "us," "our"). It is not a bank, payment processor, or financial institution.
      </p>

      <H2>1. Eligibility</H2>
      <p>
        You must be at least 13 years old (or the minimum age required in your country to use online
        services without parental consent) to create an account. By registering, you confirm this is
        true.
      </p>

      <H2>2. Your account</H2>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>
          You're responsible for the accuracy of the information you provide (name, email) and for
          keeping your password confidential.
        </li>
        <li>
          You're responsible for all activity that happens under your account. Tell us right away if
          you suspect unauthorized access.
        </li>
        <li>You may not share an account, impersonate someone else, or register with false information.</li>
        <li>
          You can request deletion of your account and associated data at any time by contacting us
          (see Section 9).
        </li>
      </ul>

      <H2>3. What the Service does — and doesn't do</H2>
      <p>
        BLNCR lets you create groups, log shared expenses, and calculates who owes whom, including a
        simplified settlement plan.
      </p>
      <p>
        <strong className="text-[var(--color-text)]">Important:</strong> BLNCR does not move money. It
        does not process payments, hold funds, or connect to your bank or card. All "settling up"
        happens outside the app — BLNCR just tracks the numbers you and your group members enter. We
        are not responsible for whether a settlement actually gets paid in real life.
      </p>

      <H2>4. Acceptable use</H2>
      <p>You agree not to:</p>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>Use the Service for anything illegal, fraudulent, or harmful.</li>
        <li>Enter false expense or settlement data with intent to deceive other group members.</li>
        <li>Attempt to access another user's account or data without authorization.</li>
        <li>
          Interfere with, disrupt, or attempt to reverse-engineer, scrape, or overload the Service
          beyond normal use.
        </li>
        <li>Use the Service to harass, abuse, or harm another person.</li>
      </ul>
      <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>

      <H2>5. Your content</H2>
      <p>
        You retain ownership of the data you enter (group names, expense descriptions, amounts, etc.).
        By using the Service, you grant us the limited right to store and process that data solely to
        operate the Service for you and the group members you invite.
      </p>
      <p>
        Other members of a group you create or join can see the expenses, balances, and activity you
        enter into that group — that's how the app works. Don't enter anything into a shared group you
        wouldn't want other members to see.
      </p>

      <H2>6. Service availability</H2>
      <p>
        BLNCR is a personal/portfolio project, not a commercial product with a guaranteed uptime
        commitment. The Service is provided on an{" "}
        <strong className="text-[var(--color-text)]">"as is" and "as available"</strong> basis. We do
        not guarantee that it will be uninterrupted, error-free, or available at all times, and we may
        modify, suspend, or discontinue it (in whole or in part) at any time, with or without notice.
      </p>

      <H2>7. Disclaimer of warranties</H2>
      <p>
        To the fullest extent permitted by law, the Service is provided without warranties of any
        kind, express or implied, including but not limited to warranties of merchantability, fitness
        for a particular purpose, and non-infringement. We don't warrant that calculations, balances,
        or settlement suggestions will always be error-free — you're responsible for verifying amounts
        before actually paying or requesting money from someone.
      </p>

      <H2>8. Limitation of liability</H2>
      <p>
        To the fullest extent permitted by law, we are not liable for any indirect, incidental,
        special, consequential, or punitive damages, or any loss of data, money, or goodwill, arising
        from your use of (or inability to use) the Service — including disputes between group members
        over money, even if those disputes stem from data entered into BLNCR.
      </p>

      <H2>9. Open source</H2>
      <p>
        BLNCR's source code is publicly available under the MIT License at{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-text)] underline underline-offset-2 hover:text-[var(--color-accent-text)]"
        >
          github.com/MdFahimHassan/BLNCR
        </a>
        . The MIT License governs your rights to the <em>code itself</em>; these Terms govern your use
        of the <em>hosted, running Service</em> at{" "}
        <a
          href="https://blncr-xi.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-text)] underline underline-offset-2 hover:text-[var(--color-accent-text)]"
        >
          blncr-xi.vercel.app
        </a>
        .
      </p>

      <H2>10. Changes to these Terms</H2>
      <p>
        We may update these Terms from time to time. If we make material changes, we'll update the
        "Last updated" date above. Continuing to use the Service after changes take effect means you
        accept the revised Terms.
      </p>

      <H2>11. Contact</H2>
      <p>
        Questions about these Terms? Reach out at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-[var(--color-text)] underline underline-offset-2 hover:text-[var(--color-accent-text)]"
        >
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <p className="mt-4 text-sm text-[var(--color-text-faint)]">
        See also our{" "}
        <Link to="/privacy" className="text-[var(--color-text-soft)] underline underline-offset-2 hover:text-[var(--color-text)]">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalLayout>
  );
}