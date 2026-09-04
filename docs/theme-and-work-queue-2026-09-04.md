# Theme and work queue verification — 4 September 2026

## Scope

Replaced the sprout mark with a geometric A/field-lines logo. Added server-rendered dark/light themes and a consultant-wide work queue inspired by the reference demo's jobs view. Existing document filing remains on client profiles. No production dependency, database migration, external submission, billing or sharing feature was added.

The optional theme cookie contains only the selected theme and lasts 180 days. The public privacy page now documents it. Client edits, archives/restores and job writes invalidate the queue so linked names, archived labels and job states can refresh together.

## Checks

- 25 unit tests pass: theme validation/cookie configuration, both palette contrast checks, queue filters, Irish calendar boundaries, overdue semantics and existing suites.
- 85 pgTAP assertions across four suites pass against local Supabase, including cross-account client/job/storage permissions.
- Production verification build and authenticated session/cache checks pass using an isolated build/server.
- Browser: theme persists on reload; dark/light switching works; an unsaved fictional client name survives a theme change without saving; narrow layout has no horizontal overflow; inspected desktop and mobile layouts; no hydration errors in the inspected browser log.
- Browser: all-jobs filter opens the correct client work; replanning a fictional cancelled job updates the open queue/count to one; cancellation returns it to zero. The fixture was restored to Cancelled; database-written transition history remains intentionally retained.

## Boundaries

This was local verification, not a hosted production release or GDPR certification. Multi-page queue navigation, concurrent count/list snapshots and full assistive-technology coverage were not browser-tested. Counts require refreshing and can differ briefly during concurrent writes. Existing production privacy, storage scanning/quota and rights-workflow gates remain open.
