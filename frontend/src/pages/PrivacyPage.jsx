import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";

const CONTACT_EMAIL = "mdfahimhassanbd7@gmail.com";

function H2({ children }) {
  return (
    <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--color-text)]">
      {children}
    </h2>
  );
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="27/09/2026">
      <p>
        This Privacy Policy explains what data BLNCR ("we," "us," "our") collects when you use the
        app, why, and how it's handled. BLNCR is an independent, open-source project.
      </p>

      <H2>1. What we collect</H2>
      <p>
        <strong className="text-[var(--color-text)]">Account information</strong>, provided directly
        by you when you register:
      </p>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>Name</li>
        <li>Email address</li>
        <li>
          Password — we never store this in plain text; it's hashed before it ever touches the
          database.
        </li>
      </ul>
      <p>
        <strong className="text-[var(--color-text)]">App data</strong>, created by you as you use the
        Service:
      </p>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>Groups you create or are added to, and their member lists</li>
        <li>Expenses you log (description, amount, who paid, how it's split)</li>
        <li>Settlements you record (who paid whom, how much)</li>
        <li>Timestamps of the above, used to build your activity feed</li>
      </ul>
      <p>
        We do <strong className="text-[var(--color-text)]">not</strong> collect payment card numbers,
        bank details, government ID numbers, or precise location data. BLNCR doesn't process real
        payments, so there's no financial account data to collect.
      </p>

      <H2>2. What we don't do</H2>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>
          We don't use third-party analytics or advertising trackers (e.g., no Google Analytics, no ad
          pixels).
        </li>
        <li>We don't sell your data to anyone, ever.</li>
        <li>We don't share your data with third parties except where Section 4 explains a real operational need (hosting).</li>
      </ul>

      <H2>3. How we use your data</H2>
      <p>We use the data above only to:</p>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>Create and authenticate your account</li>
        <li>Display your groups, expenses, balances, and settlement suggestions</li>
        <li>Show your name/email to other members of groups you belong to (so they know who they're splitting with)</li>
        <li>Diagnose bugs and keep the Service running</li>
      </ul>

      <H2>4. Where your data lives</H2>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>Your data is stored in a managed PostgreSQL database hosted on Railway.</li>
        <li>The frontend is hosted on Vercel.</li>
      </ul>
      <p>
        Both are infrastructure providers — they host the app, they don't independently access or use
        your data for their own purposes.
      </p>
      <p>
        Login sessions are kept using a JSON Web Token (JWT) stored in your browser's{" "}
        <code className="feature-code">localStorage</code>, not a tracking cookie. It's used only to
        keep you signed in and is removed when you log out or when it expires.
      </p>

      <H2>5. Who can see your data</H2>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>
          <strong className="text-[var(--color-text)]">You</strong> can see your own account details
          and any group you're a member of.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Other members of a group you join</strong> can
          see the expenses, balances, and settlement activity within that shared group — that's
          inherent to how a shared-expense app works. They cannot see your password (nobody can,
          including us — it's hashed) or any group you haven't invited them to.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">We</strong> (the maintainer) can access the
          underlying database as part of operating and debugging the Service, but do not read or use
          your personal data for anything beyond that.
        </li>
      </ul>

      <H2>6. Data retention & deletion</H2>
      <p>
        We keep your data for as long as your account is active. If you want your account and
        associated data deleted, contact us at the email below and we'll remove it, except where we're
        required to keep records for legal reasons (which, for a project like this, should rarely if
        ever apply).
      </p>

      <H2>7. Security</H2>
      <p>
        We take reasonable measures to protect your data — passwords are hashed, authenticated API
        requests use JWTs, and the codebase is open source and reviewable by anyone. That said, no
        system is 100% secure, and we can't guarantee absolute security of information transmitted
        over the internet.
      </p>

      <H2>8. Children's privacy</H2>
      <p>
        BLNCR is not directed at children under 13, and we don't knowingly collect data from them. If
        you believe a child has created an account, contact us and we'll remove it.
      </p>

      <H2>9. Your rights</H2>
      <p>
        Depending on where you live, you may have rights to access, correct, export, or delete your
        personal data. You can exercise these by contacting us directly — see Section 11.
      </p>

      <H2>10. Changes to this policy</H2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be reflected in the
        "Last updated" date above.
      </p>

      <H2>11. Contact</H2>
      <p>
        Questions about this policy or your data? Reach out at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-[var(--color-text)] underline underline-offset-2 hover:text-[var(--color-accent)]"
        >
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <p className="mt-4 text-sm text-[var(--color-text-faint)]">
        See also our{" "}
        <Link to="/terms" className="text-[var(--color-text-soft)] underline underline-offset-2 hover:text-[var(--color-text)]">
          Terms of Service
        </Link>
        .
      </p>
    </LegalLayout>
  );
}