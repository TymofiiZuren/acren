# CRM design and privacy readiness — 4 September 2026

This report records the earlier visual/privacy-centre phase only. Subsequent phone validation and rate-card work, including the latest test counts and deployment blockers, are recorded in `REQUIREMENTS.md`.

## Changes

- Shared compact corner radii and consistent alert shapes; existing theme colours, readable type, focus styles and reduced-motion rules retained.
- County, sorting and page size share one desktop filter row, stacking on mobile.
- Client profiles have direct section links to information, jobs, documents and activity.
- All authenticated pages display an explicit fictional-data-only demo notice. This is a warning, not a technical block on entering real data.
- Privacy centre separates existing product safeguards from six unresolved production requirements, with suggested responsible roles and evidence needed. It is static guidance, not an approval register or live audit.

No database, permission, retention, billing or hosting changes were made. No automatic deletion, consent checkbox, compliance score or certification badge was introduced.

## Legal and operational boundary

The request to comply with all regulations cannot be verified from this repository. Controller/processor roles, the invoicing entity, business purposes, lawful bases, approved contacts, deployment regions and supplier agreements are not established. Invoicing remains unimplemented, and its legal requirements must be reviewed before release.

The operator must implement and test rights procedures, retention and erasure (including stored files and backups), incident response, access reviews and production security settings. Assess DPIA applicability and relevant tax, scheme and accessibility obligations with qualified advisers. Do not use real client data until release gates are independently approved.

The DPC explains that security requires risk-appropriate technical and organisational measures, and that transparency requires information about the actual organisation and processing. These cannot be supplied by changing page styling:

- [DPC security guidance](https://www.dataprotection.ie/en/organisations/know-your-obligations/data-security-guidance)
- [DPC transparency](https://www.dataprotection.ie/en/organisations/know-your-obligations/transparency)
- [DPC access and portability](https://www.dataprotection.ie/en/organisations/know-your-obligations/access-and-portability)

## Verification

25 unit tests, typecheck, lint and 85 database assertions pass. Browser checks confirm section navigation, six visible open release requirements, county filtering/reset, and responsive layouts at 375, 812 and 1440 CSS pixels without horizontal overflow in the measured pages. Both themes were inspected. No new behavioural unit tests were added for this presentation-only change; actual browser behaviour is the primary check. This is not a full accessibility audit or penetration test.

The first production verification built successfully but failed its old heading assertion after “The client book” was renamed “Client book”. The local verification helper was updated to assert the new heading explicitly; no application safeguard was relaxed.

The rerun passed the production build, sign-in, HttpOnly cookie, authenticated workspace, directory contact-minimisation and no-store response checks.
