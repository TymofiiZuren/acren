# Structured workspace and private filing — 4 September 2026

## Scope and design

Used the supplied screenshot as visual direction only: dark neutral surfaces, blue primary actions, thinner type, thin borders, compact corners and underlined navigation/quiet actions. No crypto/trading functionality, logos or user account data from the screenshot were copied. UI/UX skill guidance informed the minimal grid, consistent components, focus states and responsive stacking. Changes to existing TSX files are deliberate design-token/class updates, not unrelated formatting. No new production dependencies, commits, deployment or hydration-warning suppression.

## Filing boundary

Additive local migration creates a private `client-documents` bucket and caller-scoped policies on `storage.objects`. Read/write checks use the owner UUID, client UUID and a validated object-name pattern. Client ownership is checked through existing client RLS. New files require an active client; existing files remain readable after archive. Restrictive update/delete policies deny account overwrites and removal. Existing buckets and client records are not reset or deleted.

Server Actions verify authentication and upload with the caller's session. PDF inputs are bounded to 750 KiB; the existing Next 1 MB request limit remains unchanged. Storage separately enforces size and MIME. App PDF-header checks are basic format checks, not parsing or a security scanner. The download handler checks identity and object-name shape, then relies on Storage RLS. Successful downloads use attachment disposition, octet-stream content type, no-store, nosniff and a sandbox policy. No app-generated signed URLs or public bucket were introduced.

Filenames are normalized, not anonymized. They remain personal-data candidates and appear in paths/logs. The app asks for neutral filenames. SQL tests insert only transactional object metadata; they never create/delete actual file bytes.

## Verification

- Test-first failure: missing validator and absent bucket/policies; seven storage assertions failed before implementation.
- `npm test`: 19 tests passed, including PDF normalization, size/type/header checks, path/header-injection rejection and shared-theme contrast checks. The initial field-border contrast assertion failed; the shared border token was strengthened until the 3:1 check passed. Secondary text and primary button labels pass 4.5:1 checks.
- `npx --yes supabase@2.116.0 test db`: 85 assertions passed, including 14 storage-policy/configuration assertions. Cross-account list and known-path reads, forged owner/client paths, archive behavior and update restrictions exercised with direct database roles. Existing 71 client/job assertions remain green.
- Browser: uploaded a fictional one-page PDF, saw the filed document and success state, triggered the authenticated download successfully. One fictional PDF remains in local storage; no user files were changed or removed.
- `node .scratch/check-documents.mjs`: actual authenticated attachment bytes and headers, anonymous app redirect, denied public Storage URL, denied overwrite with original bytes intact, oversized-file rejection and MIME rejection all passed. Authentication material is captured privately, never printed.
- `npm run lint`, `npm run typecheck`, `git diff --check`, isolated production build/session checks: passed.
- Desktop 1440×1000 and narrow 375×812 layouts inspected. No horizontal document overflow in measured views. Keyboard/focus styles retained. This is not a full screen-reader or accessibility audit.

## Remaining limits

Local demo, not production security/GDPR certification. No malware scanning/quarantine, download audit log, per-user storage quotas, content deduplication, bulk filing, file replacement or erasure UI. Ordinary roles cannot delete; privileged administrators can. Deleting a client does not delete object bytes: approved erasure must use the Storage API and account for backups/copies. Multi-page file navigation, simultaneous archive/upload contention and real hosted two-account sessions were not tested. The app's format check can be bypassed by a direct authorized Storage caller; type metadata does not prove file safety. Existing controller/processor, retention, rights and hosting gates remain open.

Storage follows the official [RLS access-control model](https://supabase.com/docs/guides/storage/security/access-control) and [bucket size/type restrictions](https://supabase.com/docs/guides/storage/buckets/creating-buckets). These mechanisms do not replace malware scanning or operational controls.
