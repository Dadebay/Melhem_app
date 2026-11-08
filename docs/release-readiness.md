# Release readiness

This document applies the project completion checklist to Melhem as of 2026-11-08. Melhem is a React Native CLI app; Flutter SDK, Dart analysis, `pubspec.yaml`, Flutter code generation, and Flutter flavors are N/A.

## Verified in this change

- The repository began clean on `main`; work is on `codex/melhem-completion`.
- Dependencies install from `pnpm-lock.yaml`. Type checking, ESLint error checking, Prettier, and the Jest tests pass locally.
- The notification action payload is checked before scheduling a response; navigation type errors and stale request language headers were fixed.
- A pull-request CI workflow now checks source quality and attempts Android and iOS simulator builds. Its result must be checked on the pull request.
- Android uses `tm.com.umytgroup.sanlymelhem`, version 1.0.5 (105); iOS uses `app.melhem`, version 2.0.0 (2). Version alignment and the intended next release numbers need owner confirmation.

## Open release blockers

1. **Order price:** `src/screens/Checkout/index.tsx` presents a hardcoded 5.00 delivery fee and a derived total. The backend returns its own order total. Obtain an authoritative quote before confirmation, verify required price fields and currency, and test server responses before releasing delivery ordering. Confirm the backend's duplicate-order and retry/idempotency contract; a repeated POST or response-mapping failure must not mislead the customer.
2. **Backend and legal links:** Verify production API health, order contract, image storage, and both `https://melhem.app/docs/terms` and `https://melhem.app/docs/privacy` from a release device. The public site could not be verified in this session.
3. **Device coverage:** Smoke-test onboarding, session restore and offline behavior, sign-out, search, pharmacy map, cart/order flows, reminders, deep links, background resume, empty/error states, accessibility, large text, and both translations on real Android and iOS devices. Check OS permission timing and live domain association files where applicable.
4. **Security and privacy:** Review persisted access-token storage, API error logging, SDK permissions, and store privacy declarations. Confirm that notification and location access match the user-facing explanation.
5. **Distribution:** Locate release signing materials in secure storage, validate certificate identity and the upgrade path, install and test a signed release APK on a real device, and confirm the iOS provisioning and store channel. No signed artifact or store listing was available here. A debug build is not a releasable APK.
6. **CI and review:** Require green PR checks and review before merging. Confirm the merged commit on `main` and rerun/check CI there.

## Release procedure

1. Resolve blockers, agree on new version/build numbers, and smoke-test the exact release candidate against the production-compatible backend.
2. Build a release APK or AAB with signing properties supplied outside Git. Check package ID, version, signature certificate fingerprint, and SHA-256. For an APK intended to update a Play-installed app, compare its certificate with the Play app-signing certificate.
3. Test install and upgrade on real devices; document release notes, staged rollout, health metrics, and rollback steps. Keep symbols and signed artifacts in the owner's secure artifact store.
4. Merge a reviewed green PR. Tag the exact verified commit, publish an actual GitHub Release, attach only validated signed artifacts and checksum when direct download is intended, and verify the public links. Add the verified release and store links to the README.

## Operations handover needed from the owner

Record owners and secure locations (never values) for Android/iOS signing, push credentials, backend configuration, service accounts, monitoring, backups, and billing. Record backend/admin/website deployment and rollback steps, latest successful backup and restore exercise, on-call/support contact, and secret rotation order. These operational facts are not present in this repository and must be supplied by the service owners.
