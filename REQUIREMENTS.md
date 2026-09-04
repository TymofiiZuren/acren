# Acren requirements and delivery status

Updated 4 September 2026. Status describes this local codebase, not a production certification. The original scope was the client book; rate cards, scheme workflows and invoice issuing are additional requested scope.

## What exists

| Requirement | Current status |
| --- | --- |
| Sign-up and login | Implemented; login tested locally. Hosted signup confirmation/recovery still need end-to-end verification. |
| Name, herd number, county, phone and email | Implemented with server validation. |
| Phone country/format selection | Full country names/calling codes for 245 countries/territories; selected code sits beside the number. Ireland is the new-record default; existing international numbers select their detected country. No local/bypass option. Approved `libphonenumber-js/max` formats national/international input and checks length, numbering pattern and selected country in the browser and Server Actions. Changing country clears the phone draft. Country metadata caps digit entry: extra keystrokes and overlong pastes are refused with an explanation, while deletion remains possible. Existing invalid placeholders are not bulk-rewritten but must be corrected when edited. Validation does not establish reachability or ownership. |
| Add, edit, archive, restore | Implemented and locally exercised. Archive retains data. |
| Own-client list and name/herd search | Implemented; contact fields stay out of the directory and searches stay out of URLs. |
| Database-level ownership | RLS on clients, jobs/history, rates/history and private Storage. Local test suite covers 110 assertions; a hosted two-account demonstration remains to be delivered. |
| Rate card foundation | Implemented locally: services, EUR whole-cent planning prices per job/hour/unit, paginated active/retired lists, confirmed retirement, immutable prices and database-written history. No job/invoice linkage yet. |
| Client jobs | Planned/in-progress/completed/cancelled, planning dates and database-written history; no official submission status or automatic billing. |
| Documents | Private PDF upload/download, 750 KiB limit. NOT official scheme submission; NO malware scanner connected. |
| Private GitHub repo | https://github.com/TymofiiZuren/acren — newer local changes are not yet pushed. |
| Public live URL + two handover accounts | Not delivered. Localhost is not a public deployment. SQL test identities are not handover login accounts. |

## Next build: rate card → scheme work → invoices

### 1. Rate card — foundation implemented, billing integration pending

Implemented at `/rates`: create service/name/unit/EUR price, list 25 per page, retire with confirmation and retain the original. Values are immutable after creation; replacement currently means adding a separate rate. Database RLS, column grants, bounds, retry IDs and automatic creation/retirement events are tested locally. Prices are planning amounts, with no VAT interpretation. Outstanding:

- Consultant-owned services with scheme/category, description, billing basis (fixed/hour/unit), EUR price, effective date and active/retired state.
- Database ownership checks, non-negative bounded decimal amounts, and versioned rates. Historical invoice lines snapshot their chosen rate; changing a rate never changes an issued invoice.
- Keep scheme memberships separate from chargeable work. No invented official fee or tax defaults.
- Acceptance: A cannot read/change B's rates; retired rates cannot be picked for new work; existing invoice snapshots remain unchanged after a rate edit.

### 2. Scheme workflow — not implemented

- Link client, scheme, scheme year, assigned advisor, required evidence and work items.
- Separate internal stages (draft, evidence needed, ready for review) from externally evidenced events (submitted, acknowledged, decision received). Record official reference, date and evidence for those events.
- Initially support manual preparation and recording of submissions made through the approved official channel. Do not describe a local upload as submission or acceptance.
- Direct Department integration requires documented availability, permitted access, advisor authority and integration approval. Never store an advisor's Agfood password in client records.
- Acceptance: account isolation applies to all records and files; no “submitted” event without the required reference/evidence; repeated requests do not duplicate submissions; all transitions have database-written history.

### 3. Invoice creation and issuing — requested, not implemented

- Billing setup per legal issuer: business name/address, VAT status/registration where relevant, numbering series and approved payment terms. Decide whether the issuer is each consultant or a shared firm before designing ownership.
- Draft invoice from selected work/rates, line descriptions/quantities/prices, supply date, VAT treatment, currency and due date. Calculate bounded monetary totals consistently in the database.
- Issue through an atomic operation: allocate a unique sequential number once, freeze supplier/customer/line/tax snapshots, and record who issued it and when. Prevent duplicate billing of the same work unless deliberately allowed and audited.
- Generate a downloadable invoice. Email delivery is separate: approve provider/sender/domain, confirm recipient, track failure/retries and do not mark an invoice sent on a failed delivery.
- Issued invoices cannot be casually edited or deleted. Design credit notes, corrections, payment recording, partial payments and overdue views with an accountant. No automatic charges or bank transfers.
- Acceptance: A cannot access B's invoices; concurrent issue attempts cannot reuse numbers; replay cannot double-issue; later edits to a client/rate cannot change an issued invoice; VAT/rounding and correction cases are tested.

## Security services: decisions and acceptance criteria

1. **Authentication:** keep the existing Supabase Auth. Recommended next control is authenticator-app MFA, with enrolment, recovery and step-up flows tested before enforcement. Enforce the required assurance level at database/storage boundaries as well as in screens. Google/Microsoft sign-in is optional and is not a replacement for authorisation or MFA.
2. **File scanning:** approve a private scanning deployment (for example a maintained ClamAV service in the approved hosting environment) or a contracted managed scanner. Do not send farm files to a public scanning service. Quarantine new uploads; database/storage rules must deny ordinary downloads until a trusted scanner marks them clean. Errors/timeouts remain quarantined. Handle existing files explicitly; do not silently mark them clean.
3. **Abuse protection:** assess Supabase auth limits and CAPTCHA/WAF needs against the actual deployment. Provider choice, accessibility fallback, data processing and cost require review. No provider is connected by a logo or checkbox.
4. **Operational security:** verified recovery, session policy, least-privilege operator access, monitoring without sensitive payloads, backups/restore, incident response and dependency updates.

## Information the practice owner must supply or approve

- Whether each consultant or one shared firm issues invoices; business details and VAT setup. Do not paste credentials or bank access details into chat.
- Initial services, prices, billing units, payment terms and invoicing numbering policy.
- Which schemes and years to support, evidence checklists, advisor assignments and who may approve/record submissions. Confirm official integration availability and authority if direct submission is wanted.
- Whether “security providers” means social sign-in, MFA, malware scanning or all three; approve any new service, data region, processing agreement and budget.
- Controller/processor roles, verified privacy contact, lawful bases and privacy notice; data retention by category and a tested rights/erasure workflow covering files and backups.
- Hosting projects, approved region, domain, email sender/provider and two separate test-user identities for handover.

## Release gates

### Verification on 4 September 2026

- `npm test`: 37 passing tests, including stable raw phone edits, country digit limits, malformed input and server-side validation.
- `npm run typecheck` and `npm run lint`: passed.
- `npx --yes supabase@2.116.0 test db`: 110 assertions passed across clients, history, jobs, documents and rates. Transactions roll back their fixtures.
- Isolated production build and session checks: passed (sign-in, HTTP-only cookies, authenticated workspace, contact minimisation and private/no-store response).
- Browser: typing `20255501009` retains `2025550100`, mid-number correction stays at the edit position, blur does not reformat, and country changes clear the draft. A stable preview slot prevents valid-number feedback from adding a row.
- Deployment preflight: Vercel CLI reports logged out, no linked Vercel project or hosted Supabase project reference is present. Deployment is blocked pending authenticated hosting access and approved project selection. No temporary public deployment was created.

### Outstanding delivery checks

- Deliver a public HTTPS URL, current private repo and two usable test accounts through an approved secure handover channel.
- Demonstrate through the deployed API: B's own records are accessible to B; A's direct list/read/update/archive attempts against B's client ID are denied or affect zero rows; B's record remains unchanged. Also test anonymous access and ownership reassignment.
- Verify email confirmation, recovery, session cookies, caching, RLS and Storage against the hosted project, not only local tests.
- Complete independent security/accessibility and applicable-law reviews. These requirements are not a guarantee of GDPR, tax or scheme compliance.

## Primary guidance consulted

- [GOV.UK phone-number pattern](https://design-system.service.gov.uk/patterns/phone-numbers/): accept familiar formatting and use telephone autocomplete. The approved `libphonenumber-js/max` now provides numbering-plan validation and country-aware formatting, with a save preview. Its metadata needs regular maintenance; existing data is not bulk-migrated. Database ownership is still RLS-enforced, but full numbering-plan checks run in the app/server, not PostgreSQL.
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa) and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): assurance checks and account boundaries must extend beyond the UI.
- [OWASP file uploads](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): defence in depth includes access controls, limits and scanning; a file header alone is insufficient.
- [Revenue VAT invoice information](https://www.revenue.ie/en/vat/vat-records-invoices-credit-notes/invoices/information-required-vat-invoice.aspx): required invoice particulars must inform the final billing design.
- [DAFM Farm Advisory System](https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/publications/farm-advisory-system-fas/): advisor approval and agent access are separate from building software.
