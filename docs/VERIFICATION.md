# Email verification delivery — 14 October 2026

Implemented in `D:\Projects\NexAdvisor`:

- Signup queues a single-use verification link valid for 24 hours. Tokens are stored as hashes and delivered through the existing private email queue.
- Signed-in users can resend with a persisted one-minute cooldown. Resending invalidates the previous link.
- A confirmation page requires an explicit action; simply opening a link does not consume it. The token is removed from the address bar.
- Backend checks block unverified users from creating bookings or saving expert profiles/schedules. Existing users can still sign in, recover passwords and manage existing bookings.
- Password recovery and email verification are independent. Existing accounts start unverified and can use the banner to request their link.
- Payments remain simulated. Demo emails remain local previews; no external email was sent.

Validation: all 24 integration tests passed on H2 and PostgreSQL 17.11. Backend packaging/formatting and frontend lint/TypeScript/production build passed. HTTP acceptance through Next.js checked signup email generation, resend cooldown, rejection of unverified booking, single-use confirmation, updated account state, and booking after verification. The local demo database migrated to V4 after a backup to `backend/data/backups/before-email-verification-20261014.mv.db`.

The app remains at http://127.0.0.1:3000. See `docs/COMMUNICATIONS.md` for verification behavior and SMTP setup. Remaining MVP work includes real SMTP configuration/delivery checks, scheduling timezone/exception handling, public content cleanup, and deployment/operations. No production deployment was performed.
## MVP completion verification — 15 October 2026

- H2: 30 integration tests passed; packaged backend and Spotless check passed.
- PostgreSQL 17.11: the same 30 integration tests passed in isolated nexadvisor_test on port 55441; V5 migration applied successfully.
- Frontend: lint, TypeScript (production build), calendar test and production build passed.
- Local HTTP acceptance: login/CSRF, favorites add/list/remove, verified booking, simulated payment, message, simulated cancellation/refund, account-wide counts, expert verification/profile submission, time-off add/list/remove, and cross-role rejection passed.
- The V5 demo migration ran after a stopped-database backup at backend/data/backups/before-mvp-time-off-20261015.mv.db.
- Production SMTP, hosting, backup restoration, policy acceptance and physical-device tests are not asserted by these checks. See MVP-READINESS.md.

## Deployment preparation — 16 October 2026

- Added non-root frontend/API container definitions, private PostgreSQL/API Compose services, a production environment example, and deployment/backup/restore instructions.
- Deployment setting tests passed, including rejected insecure/placeholder origins, missing credentials, invalid ports and incomplete admin bootstrap settings.
- Docker Compose configuration validated with synthetic credentials. Docker engine was not running, so image builds and container startup were not tested.
- Frontend lint, formatting, calendar tests, TypeScript and standalone production build passed.
- Started the standalone bundle and verified homepage, emitted JavaScript asset, and proxied experts API on http://127.0.0.1:3000. Restarted the existing demo backend; V5 was already current.
- Backend business logic was unchanged; integration tests were not rerun for packaging changes. No actual deployment, SMTP delivery, or backup restore drill was performed.

## Real appointment pilot hardening — 16 October 2026

- Reservation expiry is capped at the appointment start. Legacy unpaid holds whose start passed are expired as well.
- Ended sessions no longer expose meeting URLs. Valid Google Meet codes and Zoom join/personal URLs are accepted, including Zoom passcodes; arbitrary provider pages are rejected.
- Added cancellation confirmation, disabled expired payment actions, and locked booking inputs while reserving.
- Deployment now explicitly uses simulated payments and private preview emails without SMTP credentials. See BOOKING-PILOT.md for operator-assisted verification and real external meeting handling.
- All 35 integration tests passed on H2 and PostgreSQL 17.11, including duplicate reservation concurrency, payment/cancellation concurrency, short-hold boundaries and meeting lifecycle checks.
- Backend packaging/format checks and frontend lint, format, calendar/configuration tests and production build passed. Docker Compose validated with synthetic settings; container startup was not exercised.
- No actual Zoom/Meet call, physical-device session or hosted production deployment is claimed.

## Final pilot readiness pass — 17 October 2026

- Corrected expired-session state and protected-page sign-out redirect race; account-server failures offer retry instead of a misleading sign-in redirect.
- Cleared stale CSRF tokens without automatically replaying mutations. Added API regression tests and CI coverage.
- Added route error recovery and explicit 409 responses for duplicate reviews.
- Frontend lint, formatting, API/calendar/deployment checks and TypeScript production build passed. All 35 backend tests passed on both H2 and PostgreSQL; packaging and Spotless passed.
- Local acceptance passed registration/verification previews, role boundaries, favorites, booking, simulated payment, messaging, cancellation/refund and time off.
- Browser login/dashboard/sign-out confirmed the corrected redirect to home.
- PostgreSQL 17.11 backup/restore drill used nexadvisor_test and a new nexadvisor_restore_20261017 database, with matching counts (4 accounts, 1 expert, 1 booking, 1 payment, 5 migrations). The running application against the restored database successfully authenticated the synthetic client and read the restored booking. The temporary application and database server were stopped afterward. No live data was overwritten.
- Backup: workspace/work/pilot-restore-20261017.dump. Tool: scripts/database-backup.ps1. Deployment, actual external meeting admission and physical-device checks remain unverified.

## Profile photos and onboarding — 17 October 2026

- Experts can upload, replace and remove JPEG/PNG profile photos (2 MB maximum; at most 4096 × 4096 source pixels). Server validation checks decoded image type and dimensions, center-crops to 384 × 384 and re-encodes JPEG without original metadata.
- V6 stores normalized photos in the database with versioned image URLs. Cards, public detail and admin review share the photo component. Pending photos are visible only to their owner/admin; approved photos are public. Changes require approval, matching profile edits.
- Client/expert signup uses keyboard-accessible role buttons and clear next steps. Role-aware setup checklists link directly to photo and weekly availability sections. Dashboards show next five active sessions, aggregate counts, messages and account shortcuts, with useful empty/error states.
- 38 integration tests passed on H2 and PostgreSQL 17.11. Coverage includes photo privacy, normalization, invalid types/dimensions, replace/remove, CSRF, upcoming ordering and ownership.
- Frontend lint, format, TypeScript/build and API/calendar/deployment checks passed. Browser photo upload on a private synthetic expert persisted through reload and decoded as 384 × 384; setup progress updated immediately. Desktop and 390px expert onboarding/dashboard overflow checks passed. Client dashboard rendering verified.
- Local H2 database backed up while stopped to backend/data/backups/before-expert-photos-20261017.mv.db before V6 migration. No real expert photos or fabricated portraits were added to public listings. One private QA profile contains an app screenshot used as an upload fixture.
