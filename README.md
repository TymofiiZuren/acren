# Acren

A private client book for Irish agricultural consultants. Consultants can sign up, sign in, add and edit client records, search by name or herd number, and archive or restore clients.

## Security model

Tenant isolation is enforced by PostgreSQL row-level security, not by UI filters:

- every client row has a non-null `consultant_id` linked to `auth.users`;
- ownership defaults to the authenticated database user;
- RLS is enabled **and forced** on `public.clients`, `public.client_events`, `public.jobs` and `public.job_events`;
- client row policies require `auth.uid() = consultant_id`; history has an owner-only read policy;
- column grants permit only client input fields on insert and editable details/archive status on update. IDs, ownership and creation/update timestamps cannot be rewritten by ordinary accounts;
- permanent client deletion is denied to ordinary accounts, including direct API calls. Controlled erasure remains an operator release gate, not an archive action;
- database triggers write minimal change history. Accounts can read their own history but cannot insert, edit or delete it;
- the application uses only the signed-in user's publishable-key session—there is no service-role key in the app;
- an 85-assertion pgTAP suite covers account isolation, history integrity, job transitions, private document storage and restricted writes using direct database roles, independently of application filters.

Run the proof locally:

```bash
npx supabase start
npx supabase test db
```

The expected result is `Files=4, Tests=85` and `Result: PASS`. Tests use synthetic fixtures inside rolled-back transactions. Storage SQL tests exercise metadata policies, not object bytes; verify the Storage API too.

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

Jobs and events remain linked personal data; include them in approved retention, export and erasure procedures. Privileged client erasure cascades to jobs and their events. No privileged erasure flow, billing, shared-firm access or production deployment was added. See [jobs verification](docs/jobs-2026-09-04.md).

## Branding, themes and work queue

A geometric A/field-lines mark identifies Acren in the workspace, public pages and browser icon. Choose light or dark from the workspace navigation, login or landing page. Dark is the default. The optional preference is an HttpOnly, SameSite=Lax cookie retained for 180 days (Secure in production); server rendering uses the same preference, without a client-side theme flash. Theme changes preserve unfinished client-form values without saving them.

The authenticated `/jobs` work queue brings the consultant's jobs together with open/completed/overdue counts, status filters, earliest-target sorting and 20-item pagination. It uses the caller's session and existing database RLS for both jobs and linked client names. Archived clients are labelled; their jobs remain read-only. Overdue means unfinished work with a planning date before today in Ireland, not an official scheme deadline. Refresh for current counts. No billing, external submissions or automatic reminders were added.

## Private document filing and workspace design

The interface uses light or dark surfaces, fine typography, compact corner radii and underlined navigation/actions. Shared tokens and components carry the design across client, job, authentication and privacy screens. No font or production dependency was added.

Open a client profile → **Client documents** to file a PDF (750 KiB maximum). The app checks extension, MIME type, size and PDF header; this is **not malware scanning or full PDF validation**. Files download as authenticated attachments with no-store headers, not inline previews or app-generated signed/public links. PDFs may still contain active content and must be treated as untrusted. Use fictional files only until scanning/quarantine and operational controls are approved.

Apply `20260904170000_private_documents.sql` before this UI. It creates a private Supabase Storage bucket with a 768000-byte limit and PDF MIME allowlist. Postgres policies check caller identity, exact owner/client path structure and client ownership. New uploads require an active client; archived files remain readable. Uploads use `upsert: false`. Restrictive update/delete policies prevent ordinary accounts overwriting, renaming or deleting files. No service-role credentials or public sharing flow were added. The underlying Supabase platform still supports authorized signed URLs outside this app; such tokens must be treated as credentials.

File names are normalized to ASCII and included in object/download paths. Use neutral filenames and review storage/access log handling before production. Lists are bounded to 20 files per page. Refresh after a successful upload to file another; interrupted requests require checking the list before retrying. A stable form request ID plus normalized filename prevents replacing the same object, but there is no content-level deduplication.

Unlike database child rows, stored file bytes do **not** cascade when deleting a client. Approved erasure must remove storage objects through the Storage API and cover backups and downloaded copies. Per-user quotas, malware scanning/quarantine, download auditing, concurrent archive/upload races, rights workflows and production storage settings remain release work. See [design and document verification](docs/documents-and-design-2026-09-04.md).
