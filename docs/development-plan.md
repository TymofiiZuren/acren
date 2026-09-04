# Acren development plan — 3 September 2026

## Scope

Improve the existing client-book demo, retaining Next.js, Supabase, the green/cream identity, and database-enforced consultant isolation. No deployment, new production dependencies, deletion of existing records, or changes to account credentials. This is not a GDPR certification.

## Implementation sequence

1. Establish the baseline: review auth/actions/RLS and dependency audit; distinguish demonstrated vulnerabilities from hardening opportunities.
2. Test first: server-side county/file validation, bounded search/pagination, safe status messages, and browser security policy. Preserve existing RLS checks and extend direct-ID/anonymous coverage.
3. Improve the workspace: responsive navigation including sign-out, clear active/archive tabs, truthful counts, paginated private search, deliberate archive confirmation, accessible forms and recovery states.
4. Harden boundaries: authenticate each data entry point in addition to RLS; minimise list fields; move searches to POST bodies; use fixed notification codes, safe errors, no-store private responses and restrictive browser headers. Preserve Next's same-origin Server Action protection.
5. Add a privacy centre and public demo privacy information. Explain archive versus erasure, session cookies, safe test-data use and the operator's unresolved responsibilities. Do not invent a lawful basis or retention period, and do not silently purge data.
6. Verify unit tests, database isolation tests, lint/typecheck, production build, anonymous redirects, headers and the actual desktop/mobile interaction flow. Record what could not be verified.

## Acceptance criteria

- Consultant B cannot list, read by ID, update, delete or reassign A's records through the database; anonymous access is denied.
- Search does not put entered names/herd numbers in browser URLs; only a bounded page and necessary list fields reach the browser. Supabase queries still contain search values: infrastructure log redaction is a separate production gate.
- Active and archived records remain distinct; archive requires confirmation and explains that it is reversible, not erasure.
- Navigation and sign-out work on narrow screens; errors are actionable without raw provider details; forms preserve valid input and link errors to fields.
- No trackers, new third-party scripts or new production packages.

## Production release gates (operator decisions required)

Do not use real farmer data until these are resolved and independently reviewed:

- Identify the controller(s), processor role, contact and responsible person; document purposes, lawful bases, recipients, rights and complaint route in an approved privacy notice.
- Sign controller/processor and subprocessor agreements. Verify Supabase/Vercel project regions, transfers, access controls and support-access arrangements; local configuration proves none of these.
- Agree retention by category and a verified rights-request/erasure procedure including legal holds, exports, account closure and backup expiry. Archive retains data. No automatic deletion is introduced in this change.
- Configure production email verification, recovery, MFA policy, abuse controls, session lifetime, secure TLS and secrets rotation. Local auto-confirm demo settings are not production settings.
- Document incident detection/escalation, breach assessment and notifications, access reviews, backup/restore tests, and processing records; assess whether a DPIA is required.
- Independent penetration test and accessibility review before live use. Establish dependency updates and operational monitoring without logging client/search/form payloads or credentials.

## Basis

- [Irish DPC: data security](https://www.dataprotection.ie/en/organisations/know-your-obligations/data-security-guidance)
- [Irish DPC: retention periods](https://www.dataprotection.ie/en/faqs/responsibilities-data-controllers/how-long-should-personal-data-be-held-meet-obligations-imposed-gdpr)
- [Irish DPC: processor contracts](https://dataprotection.ie/en/dpc-guidance/data-processing-agreements)

The DPC calls for risk-appropriate technical and organisational measures. GDPR does not supply one universal retention period. Software controls alone do not satisfy these obligations.
