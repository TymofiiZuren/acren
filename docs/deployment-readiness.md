# Deployment handover

## Current decision

The local fictional-data demo passes its release checks. Public deployment remains blocked by missing linked Vercel and hosted Supabase projects. This is not approval to store real client data or issue real business invoices. The site retains its demo warnings.

## Checks completed on 4 September 2026

- `npm run typecheck`, `npm run lint`, `npm test`: pass, 43 application tests.
- `npx --yes supabase@2.116.0 test db`: 170 assertions pass, including advisor recommendations and client balance transitions.
- `npm run test:billing-concurrency`: eight independent SQL sessions retry one invoice without duplicate issuing. Four invoices obtain numbers 1–4 with four issue events. The script runs only against `supabase_db_acren`, creates a new random fictional owner and removes only its fixtures afterward.
- Isolated production build/session smoke: pass, including sign-in, HTTP-only cookies and private/no-store responses.
- `npm audit --omit=dev --audit-level=high`: no known production vulnerabilities reported. This is a point-in-time dependency check, not a complete security audit.
- Hosted configuration contract: Vercel rejects missing/local/non-Supabase HTTPS endpoints and non-publishable key formats before building. No supplied values enter the error message. This validates syntax, not project identity, key validity or database policies.

## Approved deployment order

1. Owner selects and connects the Vercel project and a dedicated Supabase Cloud demo project in an approved region. Keep preview/demo data separate from real practice data. Never place a service-role key in the application or a public environment variable.
2. Apply every repository migration in timestamp order to the approved demo database. Review the target first. The invoice migration adds tables and prevents cascading erasure of billed records. Do not reset or overwrite an existing database.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel for the intended environment. The current guard supports `https://<project>.supabase.co` and modern `sb_publishable_` keys. Custom domains and legacy JWT keys need an explicit reviewed configuration change. Rebuild after changing public environment values.
4. Configure Supabase Site URL, allowed redirects and email confirmation for the exact HTTPS deployment. Verify signup, confirmation, login and sign-out. Recovery remains unimplemented in the application and must be resolved before real-user release. Do not disable email verification to pass a check.
5. Deploy the demo with fictional records only. Verify migrations/policies, private caching, authentication and the billing flow against the actual hosted project. Local results do not prove hosted configuration.
6. Create two separate demo accounts and deliver credentials through an approved private channel. Never put passwords in the repository or presentation. Show B can read its own records, then show A cannot list/read/update/archive B's known client ID or reassign ownership. Repeat billing ownership and anonymous-access checks through the hosted API.

## Remaining production gates

- Approved controller/processor responsibilities, notices, contracts, retention schedule and tested rights/erasure workflow, including billed records and backups.
- Authentication recovery, abuse controls, required MFA policy, monitoring and backup/restore tests.
- Accountant review of invoice particulars, numbering, VAT treatment and correction/credit-note handling. Current billing supports one job/rate in EUR and full-payment records only.
- Retained legacy document data remains private but lacks malware scanning. Removing upload UI did not revoke direct Storage API upload permissions. Decide whether to retire that API capability or implement a private quarantine/scanning flow before real files are allowed.
- Independent security/accessibility review, printable PDF verification and hosted concurrency tests.
- Official scheme submission remains outside the app. Jobs record internal work, not Department acceptance. Email delivery and payment collection remain unimplemented.

## Rollback and data preservation

Rollback application code only to a version compatible with the additive schema. Preserve invoices and their audit events. Do not drop invoice tables, reset numbering or restore an old database snapshot as a routine UI rollback. Recovery of billing data requires an approved operator procedure and reconciliation.
