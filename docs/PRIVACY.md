# Privacy Policy

**Last updated: [27/09/2026]**

This Privacy Policy explains what data BLNCR ("we," "us," "our") collects when you use the app, why, and how it's handled. BLNCR is an independent, open-source project.

## 1. What we collect

**Account information**, provided directly by you when you register:
- Name
- Email address
- Password — we never store this in plain text; it's hashed before it ever touches the database.

**App data**, created by you as you use the Service:
- Groups you create or are added to, and their member lists
- Expenses you log (description, amount, who paid, how it's split)
- Settlements you record (who paid whom, how much)
- Timestamps of the above, used to build your activity feed

We do **not** collect payment card numbers, bank details, government ID numbers, or precise location data. BLNCR doesn't process real payments, so there's no financial account data to collect.

## 2. What we don't do

- We don't use third-party analytics or advertising trackers (e.g., no Google Analytics, no ad pixels).
- We don't sell your data to anyone, ever.
- We don't share your data with third parties except where Section 4 explains a real operational need (hosting).

## 3. How we use your data

We use the data above only to:
- Create and authenticate your account
- Display your groups, expenses, balances, and settlement suggestions
- Show your name/email to other members of groups you belong to (so they know who they're splitting with)
- Diagnose bugs and keep the Service running

## 4. Where your data lives

- Your data is stored in a managed PostgreSQL database hosted on **Railway**.
- The frontend is hosted on **Vercel**.
- Both are infrastructure providers — they host the app, they don't independently access or use your data for their own purposes.

Login sessions are kept using a JSON Web Token (JWT) stored in your browser's `localStorage`, not a tracking cookie. It's used only to keep you signed in and is removed when you log out or when it expires.

## 5. Who can see your data

- **You** can see your own account details and any group you're a member of.
- **Other members of a group you join** can see the expenses, balances, and settlement activity within that shared group — that's inherent to how a shared-expense app works. They cannot see your password (nobody can, including us — it's hashed) or any group you haven't invited them to.
- **We** (the maintainer) can access the underlying database as part of operating and debugging the Service, but do not read or use your personal data for anything beyond that.

## 6. Data retention & deletion

We keep your data for as long as your account is active. If you want your account and associated data deleted, contact us at the email below and we'll remove it, except where we're required to keep records for legal reasons (which, for a project like this, should rarely if ever apply).

## 7. Security

We take reasonable measures to protect your data — passwords are hashed, authenticated API requests use JWTs, and the codebase is open source and reviewable by anyone. That said, no system is 100% secure, and we can't guarantee absolute security of information transmitted over the internet.

## 8. Children's privacy

BLNCR is not directed at children under 13, and we don't knowingly collect data from them. If you believe a child has created an account, contact us and we'll remove it.

## 9. Your rights

Depending on where you live, you may have rights to access, correct, export, or delete your personal data. You can exercise these by contacting us directly — see Section 11.

*[Placeholder — if you expect users in the EU/UK or California, you may want a short GDPR or CCPA-specific clause here. Flag this to a lawyer if that applies to you.]*

## 10. Changes to this policy

We may update this Privacy Policy from time to time. Material changes will be reflected in the "Last updated" date above.

## 11. Contact

Questions about this policy or your data? Reach out at **[mdfahimhassanbd7@gmail.com]**.
