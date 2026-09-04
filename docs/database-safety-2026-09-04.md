# Database safety and reference-site development — 4 September 2026

## Reference and scope

Visited https://creative-griffin-ec2ed9.netlify.app/ in the browser after the web reader failed. Inspected Dashboard, Clients, Jobs, Invoices, Firm and Log. The site describes fictional/hardcoded demo data. It is useful as product guidance, not evidence of a secure backend or authoritative scheme deadlines/rates. No reference-site records were changed and no reminders were sent.

Its main workflows are a client directory/profile, jobs with stages and waiting-on-client reasons, separately billable rate-card entries, invoices linked to submitted jobs, delivery-channel snapshots, recurring work, practice totals, and session activity. “Log” is the job catalogue, not a security audit log. Firm exposes several advisors together, which conflicts with the original strict consultant-isolation requirement. No shared-firm access was added.

This implementation delivers database-enforced client integrity and a profile activity history. It does not claim to implement the entire reference product.

## Applied locally

- New additive migration `20260904120000_client_history_and_permissions.sql`, applied with `supabase migration up --local`. Existing client data was preserved; no reset or data deletion.
- Existing client RLS retained. Column grants now prohibit changing IDs, owner and creation/update timestamps. User insert access to creation/update timestamps is also denied.
- Ordinary accounts cannot permanently delete clients even through direct SQL/API requests. Archive/restore still work. A reviewed privileged erasure workflow remains necessary before production.
- New `client_events` table has enabled/forced owner-scoped RLS and read-only account privileges. A fixed-search-path security-definer trigger writes events within the client transaction; direct execution is revoked. No application service key was introduced.
- The trigger records creation, edited field names, archive and restore. No-op saves add no history; old activity is not fabricated. Event metadata remains personal data linked to a client and needs a retention policy.
- Profiles show the latest 20 events, with empty/error states and explicit Irish-time formatting on the server. Contact values are not copied into events.

Deploy migrations before the corresponding UI. Older client CRUD remains compatible; direct consumers attempting metadata writes/deletion are intentionally denied. Database administrators and service-role callers retain privileged access: this is append-only for ordinary accounts, not an administrator-proof ledger. Controlled client erasure cascades to events; backup retention needs separate handling.

## Verification

Test-first database checks initially failed on unrestricted metadata/deletion and the absent history table. After implementation, `npx --yes supabase@2.116.0 test db` passed 39 assertions across two transactional suites. They exercise direct authenticated/anonymous roles, identity defaults, known-ID isolation, forged ownership, forbidden metadata edits/deletion, automatic lifecycle events, no-op saves, rejected event forgery/edit/deletion, trigger execute privileges and history RLS. Fixtures roll back.

`npm test` passed 11 tests; `npm run lint`, `npm run typecheck` and isolated production build/session checks passed. Production authenticated responses remain private/no-store, and directory responses omit contact email. Browser verified the empty history state, saving a fictional name change, the resulting “Details updated / Changed: Name” event, and restoring the original fictional name. The existing user-created record was not edited. Two test history events and an updated timestamp remain on the fictional record by design.

## Screenshot investigation

The screenshot shows a server/client markup mismatch involving `bis_skin_checked`. No occurrence of that attribute or hydration-suppression code was found in app source. Fresh in-app browser load contained zero such attributes and zero captured hydration errors. External DOM modification is the leading hypothesis, not a proven identification of a particular extension. Next.js lists browser extensions modifying HTML as a hydration-error cause: https://nextjs.org/docs/messages/react-hydration-error.

No speculative app fix or warning suppression was added. If the warning persists in the user's other browser, compare in a clean browser profile with no extensions. Do not disable endpoint protection; identify the component responsible before changing security settings. Investigation status: not reproduced locally; external source remains unconfirmed.

## Focused security review and next development

Trust path: browser → authenticated Next server operation → caller's Supabase session → Postgres RLS and column privileges. No high-confidence cross-consultant exploit was found in this focused review. This does not cover hosted infrastructure, secret-history archaeology, supply-chain audit, professional penetration testing, backup security or browser extensions. No new dependencies were added.

Recommended next slices, each with RLS and direct-account tests before UI:

1. Jobs/rate card per consultant: composite ownership foreign keys from job to client/rate, bounded stage transitions, server-calculated amounts, waiting-on-client reasons and duplicate-submission protection.
2. Draft invoicing: transactional numbering, immutable rate/contact snapshots, exact money arithmetic and one invoice link per billed job. Tax and retention rules need operator decisions before final invoices. No automatic external sending without separate approval.
3. Derived dashboard totals from those protected rows, not hardcoded values. Recurring jobs need idempotent roll-forward and verified dates.
4. Firm access only after an explicit decision about memberships, roles and which records may be shared; never infer it from a principal dashboard mockup.

The original production gates remain open: controller/processor agreements, lawful basis and notice, regions/transfers, verified email/recovery/MFA policy, retention/rights/erasure/backup handling and incident response. Software controls do not certify GDPR compliance.

The investigation skill prevented a speculative hydration workaround. The security skill guided a focused read-only access assessment; implementation followed the user's development request. UI/UX guidance informed truthful history limits, empty states and actionable errors.

This AI-assisted review is not a substitute for a professional security audit. It is not comprehensive or guaranteed; a production system handling personal data needs qualified independent testing and operational review.
