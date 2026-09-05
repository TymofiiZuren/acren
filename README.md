# Acren

Deployment status and operator steps: [deployment handover](docs/deployment-readiness.md). Local checks pass; hosted access and production approvals remain outstanding.

## Technology

- **Next.js App Router, React and TypeScript** provide the pages, server-rendered interface and form actions.
- **Tailwind CSS** provides the responsive layout, themes and shared visual styles.
- **Supabase Auth** manages consultant accounts and server-side sessions.
- **Supabase PostgreSQL** stores clients, work, rates and invoices. Forced row-level security keeps each consultant's records separate at the database boundary.
- **libphonenumber-js** validates and formats phone numbers against the selected country's numbering plan.
- **Node's test runner, ESLint, TypeScript and pgTAP** check application logic, code quality and database security rules.
- **Vercel** is the intended web host; a production project has not yet been connected.

The running product does not use an AI model or call an AI API. Its recommendations are consultant-entered work estimates, not machine-generated advice.

Current mini presentation: [Acren release handover](artifacts/acren-release-mini.pptx), five editable slides for importing into Keynote. Rendered slides were inspected; native Keynote import remains untested. It predates advisor recommendations and the latest test counts below.

## Advisor relationship and client balance

The signed-in consultant is the client's advisor, identified by their account email and business name when configured. No separate staff access, shared-firm assignment or farmer login is implied. In a client profile, **Advisor & balance → Recommend work for this client** records a description, active rate and estimated quantity. This atomically creates planned work and an immutable net-price estimate. It neither messages the farmer nor records their acceptance. Cancel/replan through the existing job controls; cancel and replace an incorrect recommendation.

The jobs list shows recommended quantities with their billing units. Completing recommended work enables the existing invoice flow, prefilled with its quantity/rate if that rate is still among the 200 available active rates. The advisor must review actual work before issuing; the invoice can differ from the estimate.

**Client owes** sums all issued, unpaid invoices including VAT. Drafts, discarded invoices and fully paid invoices do not count. **Estimated unbilled work** sums recommendations excluding cancelled and invoice-linked jobs, before VAT. Ordinary jobs without recommendations have no estimated price and are excluded from that estimate. Open/completed job counts include all jobs. Partial payments remain unsupported. Refresh to see changes made in another tab.

Apply `20260904220000_advisor_work.sql` after billing and before this UI. Forced owner-only RLS, composite owner foreign keys and an authenticated transaction protect recommendations. The balance function runs with caller permissions and aggregates the full dataset rather than the paginated invoice display. Ordinary accounts cannot rewrite recommendation snapshots. Rates referenced by a recommendation must be retained until the approved erasure workflow resolves them.

A private client book for Irish agricultural consultants. Consultants can sign up, sign in, add and edit client records, search by name or herd number, and archive or restore clients.

See [current requirements and owner decisions](REQUIREMENTS.md) for delivery status, phone-format behaviour, billing scope, and the unimplemented scheme-submission and security-provider work. Private document storage is not submission of an application.

The [demo review presentation](artifacts/acren-demo-review-final.pptx) is an editable, seven-slide PPTX for opening in Keynote or PowerPoint. It describes an earlier local snapshot: its document-upload slide predates the removal of that feature. See `REQUIREMENTS.md` for current scope. Its slides were rendered and inspected, but native Keynote import was not tested here.

## Phone validation

Phone entry defaults to Ireland and uses `libphonenumber-js/max` for national/international formatting and strict numbering-plan checks in the browser and Server Actions. Local/as-entered bypasses are removed. Changing country clears the phone draft. Country-specific digit caps reject extra keystrokes and overlong pastes with an explanation; invalid lengths or country mismatches still prevent saving. Accepted edits remain exactly as typed, including on blur, so formatting cannot move the caret. Stored numbers are formatted only when opening the form; a stable preview shows the international value that will be saved. Existing data is not rewritten, so placeholder phone values must be corrected when editing. This is not SMS verification or proof that a number is reachable. Keep the pinned library's metadata updated as numbering plans change. Direct database writes remain governed by the existing SQL constraints, not this JavaScript validator.

## Rate card

The authenticated `/rates` screen supports EUR prices per job, hour or unit, active/retired lists and confirmed retirement. Service names, units and whole-cent prices are immutable; retire and replace a rate to change them. Creation retries use a stable form ID, and the database records creation/retirement events. Active rates can now be copied into invoice drafts for completed jobs. Effective-date scheduling and linked rate versions remain unimplemented.

Apply `20260904180000_rate_card.sql` before using this feature. It adds `rates` and `rate_events` without rewriting existing data. Both tables have forced owner-only RLS. Ordinary accounts cannot delete rates or forge history; account erasure must handle these retained records in the approved operator workflow.

## Billing under each consultant's business name

Apply `20260904200000_consultant_invoices.sql` after the client-job and rate-card migrations, before deploying the billing UI. This additive migration retains existing data and adds owner-only billing profiles, invoices, events and private numbering counters. It also locks status changes for jobs attached to a live invoice. Invoice foreign keys intentionally prevent cascading erasure of billed clients/jobs/rates; the approved retention/erasure workflow must account for this before production.

Open **Invoices → Business details** to enter your business name, address and explicit VAT status. Complete a client job, choose **Create invoice**, select an active rate, enter quantity, customer billing address, supply/due dates and the applicable ordinary VAT rate if registered. The database copies these details into an immutable draft and calculates whole-cent totals. Review and confirm **Issue invoice** to allocate a sequential number for your consultant account. Printing supports the browser's Save as PDF. Issuing does not email the farmer. **Record full payment** records receipt only; it does not collect money.

Each invoice bills one job with one rate in EUR. Fixed rates use quantity 1; hours/units accept two decimal places. Duplicate live invoices for a job are denied. Discarding an unissued draft retains history and releases the job for replacement. Changing business details requires replacing unissued drafts. Issued invoices cannot be edited or discarded. Rate/customer edits never rewrite snapshots. Number allocation and event creation are transactional; replay does not allocate another number. Ordinary accounts cannot directly write invoices, counters or events; authenticated database functions check ownership and transitions independently of the UI.

This is fictional-data demo functionality, not a tax-compliance certification. Credit notes, partial payments, multi-line bills, email delivery, special VAT cases, numbering imports and payment integrations remain out of scope. The earlier presentation predates billing. Production requires accountant review, approved retention/erasure and hosted verification.

## Security model

Tenant isolation is enforced by PostgreSQL row-level security, not by UI filters:

- every client row has a non-null `consultant_id` linked to `auth.users`;
- ownership defaults to the authenticated database user;
- RLS is enabled **and forced** on `public.clients`, `public.client_events`, `public.jobs`, `public.job_events`, `public.rates` and `public.rate_events`;
- client row policies require `auth.uid() = consultant_id`; history has an owner-only read policy;
- column grants permit only client input fields on insert and editable details/archive status on update. IDs, ownership and creation/update timestamps cannot be rewritten by ordinary accounts;
- permanent client deletion is denied to ordinary accounts, including direct API calls. Controlled erasure remains an operator release gate, not an archive action;
- database triggers write minimal change history. Accounts can read their own history but cannot insert, edit or delete it;
- the application uses only the signed-in user's publishable-key session—there is no service-role key in the app;
- the pgTAP suite covers account isolation, history integrity, job transitions, billing snapshots/rounding/retries, rate-card protection, private document storage and restricted writes using direct database roles, independently of application filters.

Run the proof locally:

```bash
npx supabase start
npx supabase test db
```

The expected result is `Files=5, Tests=110` and `Result: PASS`. Tests use synthetic fixtures inside rolled-back transactions. Storage SQL tests exercise metadata policies, not object bytes; verify the Storage API too.

## Local setup

Requirements: Node.js 20+, npm, Docker, and the Supabase CLI (the commands below can run it through `npx`).

```bash
npm install
npx supabase start
cp .env.example .env.local
```

Copy the local API URL and publishable key reported by Supabase into `.env.local`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local confirmation emails are available in Supabase Mailpit.

## Validation

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx supabase test db
```

## Deploy

**Demo only:** complete the [production privacy gates](docs/development-plan.md) before entering real client data. Deployment alone is not GDPR readiness.

1. Create a hosted Supabase project and apply all files in `supabase/migrations/` in order, before deploying the application. For an existing local database, use `npx supabase migration up --local` (not a reset).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel.
3. Add the Vercel production URL to Supabase Auth's allowed redirect URLs.
4. Deploy the repository to Vercel.
5. Create two confirmed demo users, add a different client under each, and rerun the cross-account access demonstration before handoff.

Never add a Supabase secret/service-role key to Vercel for this application.

## Privacy-focused workspace update

See the [development plan](docs/development-plan.md), [focused security review](docs/security-review.md), and [verification report](docs/verification-2026-09-03.md).

- Search uses Server Actions (POST); entered names/herd numbers do not go into the page URL. Supabase query logging still needs a production review.
- Directory queries return only ID, name, herd number and county, in pages of 10, 25 (default), or 50. Contact details remain on authenticated profile/edit screens; profile links disable prefetch so contact data is fetched when opened.
- Each data action verifies the session; database RLS remains the ownership boundary. No service-role key is used by the app.
- Auth uses server-only, HttpOnly, SameSite=Lax cookies, with Secure enabled in production. Do not introduce a browser Supabase client without revisiting this cookie architecture.
- Browser headers restrict framing, referrers, object embedding and device permissions. This is a capability-restricting CSP, not a complete nonce-based script policy.
- Public `/privacy` and authenticated `/privacy-centre` explain demo limitations. Archive is reversible retention, not erasure; export/erasure and account closure remain production work.
- Set `NEXT_DIST_DIR` only for an isolated verification build; ordinary development continues to use `.next`.

## Client-book features

Filter active or archived clients by county and combine the filter with name/herd search. Choose A–Z, Z–A, recently updated or newest added, then select Search to apply. Reset filters clears the search, county and sort order. Filters travel in POST bodies and are not persisted after leaving/reloading the directory.

View client opens a read-only profile with contact details, status, herd reference and record dates in Irish time. Call/email links open the user's chosen application; no communication is sent automatically. Edit details opens the existing form. All profile reads use the caller's session and database RLS.

Recent activity shows the latest 20 events, written transactionally by the database for creates, detail changes, archives and restores. Unchanged saves add no event. Tracking begins when the history migration is applied; old activity is not backfilled. Events contain ownership/client IDs, event type, changed field names and database timestamps, not old/new contact values. This is not a read-access log and is not tamper-proof against database administrators or service-role access. These privileged credentials must remain outside the app. An approved erasure operation can remove associated events through the client foreign key; define retention/backup handling before production.

See [reference-site development scope and database verification](docs/database-safety-2026-09-04.md) for the latest changes and remaining release decisions.

## Client jobs

Open a client profile → **Client jobs** → **Add job**. Supply a short title and optional planning date. Jobs move from Planned → In progress → Completed, with cancellation and explicit reopening/replanning. Completion is not an application submission or an invoice. Dates are user-entered planning dates, not verified scheme deadlines; no messages or reminders are sent.

This first slice fixes the title and date after creation: cancel and replace an incorrect job. Cancellation retains the record and can be reversed. New-job drafts are not saved when leaving the page. Profiles show 10 jobs per page and the latest 20 database-written status events for jobs on the current page. Archived-client jobs remain visible but are read-only.

Apply `20260904150000_client_jobs.sql` before deploying this UI. The additive migration preserves existing clients. Jobs use owner-only RLS and a composite client/owner foreign key. Column grants prevent ordinary accounts changing ownership, linkage, metadata or deleting records. Triggers validate transitions, serialize against client archive changes, increment versions and append status-only history. Server Actions use an atomic expected-version update to reject stale saves. Each creation form has a unique request ID; replaying it cannot create a second job, and the action accepts an existing result only when the caller can read an exact payload match.

Jobs and events remain linked personal data; include them in approved retention, export and erasure procedures. Unbilled client erasure cascades to jobs/events, but invoice references prevent erasing billed records through that path. No privileged erasure flow, shared-firm access or production deployment was added. See [jobs verification](docs/jobs-2026-09-04.md) for the earlier job-only snapshot.

## Branding, themes and work queue

A geometric A/field-lines mark identifies Acren in the workspace, public pages and browser icon. Choose light or dark from the workspace navigation, login or landing page. Dark is the default. The optional preference is an HttpOnly, SameSite=Lax cookie retained for 180 days (Secure in production); server rendering uses the same preference, without a client-side theme flash. Theme changes preserve unfinished client-form values without saving them.

The authenticated `/jobs` work queue brings the consultant's jobs together with open/completed/overdue counts, status filters, earliest-target sorting and 20-item pagination. It uses the caller's session and existing database RLS for both jobs and linked client names. Archived clients are labelled; their jobs remain read-only. Overdue means unfinished work with a planning date before today in Ireland, not an official scheme deadline. Refresh for current counts. Billing is available through client profiles and `/invoices`; external submissions and automatic reminders remain unimplemented.

## Retained document storage and workspace design

The interface uses light or dark surfaces, fine typography, compact corner radii and underlined navigation/actions. Shared tokens and components carry the design across client, job, authentication and privacy screens. No font or production dependency was added.

The generic document section, navigation link and application upload action have been removed. The product is focused on the client book, scheme application work, rates and invoices, not a general file store. Existing files have not been deleted. Existing download links remain authenticated attachments with no-store headers; there is no new sharing or public access.

The historical `20260904170000_private_documents.sql` migration remains to preserve existing installations and protections. It creates a private Supabase Storage bucket with a 768000-byte limit and PDF MIME allowlist. Postgres policies check caller identity, exact owner/client path structure and client ownership. Its Storage API insert permission still requires an active client; removing the application UI does not revoke platform API permissions. Restrictive update/delete policies prevent ordinary accounts overwriting, renaming or deleting files. No service-role credentials or public sharing flow were added. The underlying Supabase platform still supports authorized signed URLs outside this app; such tokens must be treated as credentials.

Existing file names are included in object/download paths. Review storage/access log handling and any retained data before production. Removing the feature does not authorise erasing previously stored files.

Unlike database child rows, stored file bytes do **not** cascade when deleting a client. Approved erasure must remove storage objects through the Storage API and cover backups and downloaded copies. Per-user quotas, malware scanning/quarantine, download auditing, concurrent archive/upload races, rights workflows and production storage settings remain release work. See [design and document verification](docs/documents-and-design-2026-09-04.md).
