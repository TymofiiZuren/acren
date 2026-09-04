# Verification — 3 September 2026

## Result

Local demo improvements implemented. Primary signal is **partially validated overall**: core browser flows and local isolation pass; production readiness is not established. No hosted deployment or real personal-data processing was authorised or performed.

## Checks and evidence

- `npm test`: 7 passing tests. Covers input normalisation, malformed/file/county inputs, bounded search parsing, fixed notice messages, browser-policy directives and session-cookie flags.
- `npx --yes supabase@2.116.0 test db`: 16 passing pgTAP assertions. Covers separate books, ownership defaults, blocked cross-owner creation/transfer, read/update/delete isolation, known-UUID lookup, archive, anonymous reads/inserts and absent user ID. Test transaction rolls back; existing records are untouched.
- `npm run lint`, `npm run typecheck`, `git diff --check`: pass.
- Production `npm run build` in `.scratch/production-build`: pass. Temporary production server on loopback port 4318 used local Supabase, then stopped; the existing development server on 4317 was left running.
- Actual authenticated production response: HTTP 200, `Cache-Control: private, no-store, max-age=0`. Development mode returns its own `no-cache, must-revalidate` override; production is verified separately.
- Local sign-in through the SSR client: succeeds, emits HttpOnly/SameSite=Lax cookie options, authenticated workspace loads, fictional contact email absent from directory response. Secure=true is covered by the production-options unit test, not a deployed HTTPS cookie test.
- `npm audit --omit=dev --json`: exit 0, zero known production dependency vulnerabilities at audit time.

## Browser checks

Verified against the running application:

- Create fictional client, server validation error, focused linked error summary, correction and successful save.
- Edit fictional client, invalid herd number, correction and successful save without re-entering the other details.
- Herd-number search, no-match search, Clear restoring all results. URL stays `/clients` with no entered search data. Final Clear implementation retested successfully.
- Archive dialog defaults focus to Cancel; Cancel leaves record active. Confirm removes fictional record from active book and increases archived count. Restore returns it to the active book and leaves the archive empty.
- Anonymous browser navigation to `/clients` lands on `/login`; no browser console errors during the checked flows.
- Workspace layout inspected at 375px and 1440px; no horizontal overflow detected. Existing tablet-width view also inspected. Mobile sign-out/navigation are visible; public login fields are 48px tall at 375px. Public privacy page visually inspected at 375px.

One record named **QA Fictional Client Updated** remains in the local demo account after the create/edit/archive/restore test. It contains fictional data. The existing user-created record was not edited or archived. No records were permanently deleted.

## Issues found and resolved during this pass

- Clear initially changed React state before native form submission, removing its submitter and leaving stale results. It now submits an explicit clear intent and resets the field after completion; retest passes.
- Uncontrolled form resets could lose entered values on failed submission. Client fields are controlled; correction-after-error was verified in the edit flow.
- An intermediate state-sync effect failed lint. Replaced it with state changes within the action completion; lint passes.
- First regression tests intentionally failed before implementation. Final unit suite passes.
- A stale in-app tab was unavailable; testing continued in the existing live workspace tab. Full-page capture from the in-app viewport produced oversized blank canvas, so screenshots are not treated as pixel-exact visual baselines.

## Remaining coverage and release gates

- Page-two UI behaviour with more than 25 records, concurrent edits, slow/offline recovery, signup email verification, password recovery and MFA have not been end-to-end verified. No full accessibility audit or independent penetration test was performed.
- Fresh production HTTPS cookie issuance, expired-session refresh and hosted cache/CDN behaviour still need deployment-level testing.
- Production controller notice/contact, lawful bases, regions/transfers, processor contracts, retention, rights/export/erasure/account-closure workflow, backup expiry and incident response remain blockers. See `development-plan.md`.
- Existing session cookies adopt the strengthened flags when reissued; users should sign in again after deployment. Do not treat a UI warning as an enforcement barrier against entering real data.

The design skill informed accessible navigation, visible states, spacing, error focus and responsive checks while preserving Acren’s existing visual identity. The security skill was used for a focused read-only assessment; it was not an exhaustive security audit or a compliance certification.

## Follow-up feature pass

Added county filtering, four sort orders, filter reset, and authenticated read-only client profiles with safe call/email links, archive status and record dates. Existing records and schema were not changed. The UI/UX skill guided labelled controls, selection feedback and the mobile profile layout without replacing the existing design system.

Verification: 9 unit tests pass, including unsupported filter/sort rejection and contact URI/header-injection rejection. Lint, typecheck, diff check, 16 database-isolation assertions and isolated production build/session/no-store checks pass. Browser verified combined Carlow + recently updated filtering (one matching record), selected controls persisting after submission, reset restoring two records, Z–A reversing row order, profile navigation and content, and 375px profile layout without horizontal overflow. Anonymous HTTP access to the new profile returns 307 to `/login`.

An initial browser check exposed native form reset clearing selected dropdowns while filtered results remained. The directory now prevents implicit form reset and uses its explicit Reset filters action; retest passed.

Primary signal: met for the checked local feature flows; partially validated overall. External phone/email applications were not launched or used. Multi-page filtering under concurrent changes, archived-profile rendering, complete accessibility testing and production GDPR release gates remain unverified. No new client records were created during this follow-up pass.

## Draft protection and copy actions

Added in-memory dirty-field tracking, an accessible confirmation dialog for ordinary in-app links and external form submissions (including sign-out), best-effort browser unload warnings, and explicit saved/unsaved status. Edit cancellation and back navigation now return to the client profile. Profiles offer user-triggered copy actions with success/failure feedback and a clipboard privacy warning. No drafts are persisted in browser storage. Existing authorisation and database policies are unchanged.

Verification: `npm test` (10 passing tests), `npm run lint`, `npm run typecheck`, `git diff --check`, and the isolated production build/session/no-store check pass. The local database suite passed all 16 assertions during this pass. Browser checks confirmed dirty status, Keep editing retaining the draft, Leave without saving returning to the unchanged saved profile, reverting the name clearing dirty status, clean cancellation, and successful copy feedback for the fictional herd number. The profile was inspected at 375px without horizontal overflow. No saved client records were changed in this pass.

An initial native-confirm browser check timed out. The confirmation was replaced with an HTML dialog; a stale development page still timed out until a fresh load. The latest loaded implementation passed the above navigation checks. UI/UX guidance informed safe default focus, feedback, and navigation wording.

Primary signal: met for checked local flows; partially validated overall. Browser back/forward is not intercepted, and unload warnings depend on browser/platform behaviour. Sign-out interception, save-error recovery with the new guard, clipboard-denied behaviour, and a full keyboard/screen-reader audit still need dedicated end-to-end coverage. Clipboard contents may be accessible to other device applications. Production privacy and GDPR release gates listed above remain open.

## Adjustable directory size

Added labelled 10/25/50 results-per-page selection to active and archived directories. The submitted selection controls server query ranges, last-page clamping, result ranges and navigation counts. Search applies from page 1; reset restores 25. Server validation rejects unsupported sizes, including oversized requests. No new dependencies, storage, contact fields, or database policies were introduced. UI/UX guidance informed the native labelled control and pending/unapplied feedback.

Checks: test-first assertions initially failed as expected, then all 11 unit tests passed. `npm run lint`, `npm run typecheck`, `git diff --check`, and `.scratch/production-check.mjs` passed, including authenticated no-store and contact-minimisation checks. Browser verified applying 10 and 50, retaining selections after submission, resetting to 25, unchanged `/clients` address, and no horizontal overflow at 375px. Records were not changed.

Primary signal: partially validated. Selection/reset flows pass, but multiple-page navigation with more than 10 records and archived-directory pagination have not been exercised end-to-end. Existing production privacy release gates remain open.
