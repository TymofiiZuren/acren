# Security review — 3 September 2026

Focused first-pass review of the client-book application, not a full infrastructure or penetration audit. Trust boundaries: browser → Next.js Server Actions → Supabase user session → Postgres RLS. Public surfaces: home, signup, login. Authenticated surfaces: list, add, edit, archive and restore. No uploads, payment integrations, AI processing, custom webhooks or deployment pipeline found in application source.

## Baseline assessment

No high-confidence cross-tenant vulnerability was identified in the reviewed code. RLS is enabled and forced; SELECT/INSERT/UPDATE/DELETE bind ownership to `auth.uid()`, including UPDATE's new-row check. This is not proof that the whole system is secure. The existing 12 database tests are the baseline; additional tests and runtime results are recorded separately after implementation.

`npm audit --omit=dev --json`: exit 0, zero reported vulnerabilities, 27 production dependencies (3 September 2026). Lockfile exists and is tracked. No service-role use, raw SQL interpolation, custom HTML injection or client-payload logging found in `src`. No new dependencies are planned. Remote infrastructure, full history secret archaeology, platform accounts, build supply chain and provider logging are not verified by this focused review.

## Hardening and privacy observations (not claimed exploits)

- Existing GET search puts names/herd numbers into history and potentially access logs. Move browser searches to POST; backend query log policy still needs review.
- List selects every field although contact details are not needed for a directory. Return a narrow list projection.
- RLS protects actions, but explicit per-entry-point authentication improves expired-session behaviour and defence in depth.
- Signup returns provider error text; use stable public messages. Query-string notices should use known codes, not arbitrary caller-supplied copy.
- No retention/erasure workflow or approved privacy notice exists. Do not mistake archive for deletion.
- `supabase/config.toml` is local demo configuration: email confirmation is disabled and provider password minimum is 6. Production identity, email confirmation, password/session/MFA and abuse settings need explicit verification, not assumptions based on UI validation.

## Remediation scope

Implement the non-destructive application hardening and responsive UI in `development-plan.md`. Defer production account settings, legal bases/retention decisions and real-data erasure until the operator supplies the required decisions. The audit phase is complete; implementation follows the user's separate request to improve the product.

This AI-assisted first-pass review is not a substitute for a professional security audit. It is not comprehensive or guaranteed; production systems handling personal data need qualified independent testing and operational review.
