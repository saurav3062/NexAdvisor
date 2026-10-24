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

## Launch operations — 17 October 2026

- 47 backend integration tests passed on H2 and PostgreSQL 17.11. Added commission snapshots, idempotent financial actions, cancellation cutoff, issue ownership, payout holds/recovery, deletion review/obligation checks, account anonymization, policy consent, raw-body signature verification and receipt-only callback deduplication.
- PostgreSQL upgraded from V6 through V10 successfully. Local demo database backup created at backend/data/backups/before-launch-operations-20261017.mv.db before applying operations migrations. Known fictional seed profiles retired.
- Frontend lint, TypeScript/production build, API/calendar/deployment tests and operational guard checks passed.
- Debian Nginx/systemd/backup/monitoring templates and installation guide supplied. No real Cashfree API transaction, hosted deployment, off-host backup or remote restore has been performed. Physical iOS/Android/Zoom/Meet acceptance and final policy/business review remain operator work.

## Scheduling and account controls — 2026-10-18
- 58 backend tests passed on H2 and PostgreSQL 17.11: 55 integration tests plus 3 DST/local-time tests.
- Covered mutual reschedule consent, unchanged original reservation pending acceptance, conflicting/concurrent acceptance, preserved price/duration, stale meeting-link removal, notification invalidation, missing-link privacy/deduplication, account restriction enforcement and password/verification/obligation checks for self-service closure.
- Frontend production build completed; lint, type checks, API-client regression checks and calendar export checks passed.
- Local demo database backed up before V11; V11 migrated successfully and the app restarted at http://127.0.0.1:3000 with backend port 8081.
- Browser inspected the updated account-closure form and booking navigation using an existing synthetic test account. No real account was deleted or restricted during browser verification.
- This does not establish real email delivery, live payment processing, actual video attendance or acceptance on the Debian production host.

## Console startup and deployment preparation — 2026-10-18
- `npm start` now builds and starts backend plus frontend in one console, waits for API and proxied database health, and prints the local URL. Tested the complete build/start path on Windows. Both health endpoints returned 200.
- Sent Ctrl+C to the full-app console: observed graceful backend/database shutdown and verified both ports 3000 and 8081 were released. `start:fast` reuses the builds; `dev` starts both services with frontend hot reload.
- Six launcher tests pass (port conflicts, readiness/retry/cancellation, generated configuration, injection rejection and data-preserving deployment commands). Existing deployment and operations checks pass; frontend build, lint and formatting checks pass.
- Docker Compose configuration validates with synthetic settings. Added dependency health gating, API/proxied frontend probes and bounded logs. Added CI coverage for launcher tests and Compose configuration validation.
- Docker Engine is unavailable locally. Container image builds/full Compose launch and Debian HTTPS, backups and restore acceptance remain to be verified on the actual server. No deployment credentials or server access were provided, and nothing was deployed remotely.


## Reliability and authenticated acceptance — 19 October 2026

- 70 backend tests passed on both H2 and PostgreSQL 17.11: 63 integration tests, 3 timezone/DST tests, 2 safe-error tests, 1 job-isolation test and 1 test-database guard test. PostgreSQL `verify` also passed packaging and formatting checks.
- The authenticated HTTP journey uses real login/session cookies, then reservation, simulated payment, mutually accepted reschedule, Google Meet link, duplicate message submission, cancellation/refund and self-service closure/session revocation.
- Added checks for original booking retries after rescheduling, cancelled proposals/stale notifications, restricted recovery/verification, atomic shared throttling, safe error references and duplicate message keys. Database outage tests exercise the exception handler; they are not a production failover drill.
- Frontend lint, type checking, formatting, API regression, calendar, six launcher tests, deployment configuration and operational guard checks passed. Production Next.js build completed.
- Stopped local H2 backed up to `backend/data/backups/before-reliability-20261019.mv.db`; V12 migrated successfully. Started the production builds with `npm run start:fast`. Homepage, experts, login, proxied categories, API health and correlated invalid-request responses passed live HTTP checks at localhost:3000/API:8081.
- Temporary PostgreSQL test server stopped after verification. The local app remains running with simulated payments and private preview email.
- No Docker image startup, Debian deployment, real Cashfree transaction, SMTP delivery, load benchmark, independent security audit or physical-device meeting was performed in this pass. See LAUNCH-GATE.md for the remaining acceptance boundary.


## Developer SOP and unified startup — 24 October 2026

- Added docs/DEVELOPER-SOP.md and linked it from the root README and Debian guide. It covers prerequisites, local development, production startup, configuration, routine operations, updates, backups, smoke checks and troubleshooting.
- Root start.ps1/start.sh and scripts/start.mjs reuse existing launchers. Local mode installs missing npm dependencies before invoking the full-app launcher. First deployment generates private configuration; subsequent deployment preserves it. No new database or service manager was introduced.
- Nine launcher tests and deployment configuration tests passed. Windows and Git-for-Windows Unix wrapper help commands passed from outside the repository, as did shell syntax checks and rejection of unknown commands. Full local startup correctly rejected an occupied port without terminating the existing service.
- Docker daemon was unavailable, so container startup was not exercised. No hosted deployment, system-package installation or changes to live secrets were made. Existing application production-build and database test evidence remains in the earlier entries.
