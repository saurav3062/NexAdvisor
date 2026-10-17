# MVP acceptance and launch handoff

Scope: an invitation-only expert-booking pilot with simulated payments. The original blue-and-white UI and Java/Spring/PostgreSQL stack are retained. This is not a real-money marketplace.

## Status — 17 October 2026

The implemented client/expert flows have passed local acceptance and are ready for
an operator-assisted pilot. Payments and email remain simulated; Zoom/Google Meet
calls use expert-provided links. See [BOOKING-PILOT.md](BOOKING-PILOT.md).

The latest pass fixes expired-session state, sign-out routing, server-unavailable
session recovery, and duplicate review responses. A route error page supports
retry without silently repeating booking actions. Frontend API regression tests
are included in CI. All 35 backend tests pass on H2 and PostgreSQL.

A PostgreSQL backup was restored into a separate test database, record counts
matched, and the application successfully logged in and loaded a restored booking.
This verifies the local recovery workflow, not a hosted backup schedule. Deployment,
real expert onboarding, operator identity checks for preview links, business policies
and an actual provider meeting/device check remain the launch prerequisites below.

## Implemented product flows
- Client signup, email verification, login, password recovery and profile editing.
- Expert profile submission, admin approval/rejection and weekly UTC schedule editing.
- Expert time off entered in the device timezone and stored as UTC instants; overlapping reservations are rejected. Existing bookings are never silently cancelled.
- Search, categories, ratings, saved-expert shortlist and profile detail.
- 30/60 minute booking, server pricing, 15-minute unpaid holds, concurrency protection and simulated confirmation/refunds.
- Local-time preview before booking, local-time booking list, and UTC calendar (.ics) export for confirmed sessions. Calendar copies must be removed manually after cancellation.
- Participant messages, external meeting links, completed-session reviews, and queued email notifications/reminders.
- Load-more controls for bookings, payments, messages, booking selectors and saved experts. API safety limit is 10,100 records per list; account-wide dashboard counts are independent of pagination.

## Repeatable checks
- Frontend: npm run lint; npm run format:check; npm run test:api; npm run test:calendar; node scripts/test-deployment.mjs; npm run build.
- Backend: mvn verify from backend/. Tests own and clear their configured database. NEVER point tests at user data.
- PostgreSQL tests: use a disposable nexadvisor_test database and override SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME and SPRING_DATASOURCE_PASSWORD before mvn verify.
- GitHub Actions configuration verifies frontend and both H2/PostgreSQL suites when this directory is committed and pushed. No remote CI run or deployment is implied.

## Required before inviting public users
Deployment packaging, configuration validation, and backup/restore commands are now available in [deploy/README.md](../deploy/README.md). These are preparation tools; actual hosting and delivery checks below are still required.

1. Configure PostgreSQL, HTTPS, secure session cookies, PUBLIC_ORIGIN and server-only BACKEND_URL. Keep the API private. Run migrations after taking a database backup.
2. For this pilot, keep emails simulated using private previews. An operator privately hands each participant their own verification/recovery link after checking their identity. Users check bookings/messages for changes; no email reminders are delivered. Real SMTP is deferred.
3. Create the initial admin with the documented bootstrap environment variables, then remove those variables. Review all real expert profiles. Do not publish fictional demo profiles as real experts.
4. Establish your legal entity/contact details, privacy/retention policy, terms and a working account-deletion request process. The demo acknowledgement is not legal consent. These business policies cannot be invented by the application.
5. Add infrastructure rate limits, alerting and database backups. Rehearse restoring a backup to a separate database, then verify login and bookings there before accepting the backup strategy.
6. Run the acceptance flow on the actual deployment and physical iOS/Android devices. Confirm preview emails, cookies, origin, timezone display and external Zoom/Google Meet behavior, including provider admission settings.

## Deliberately outside this MVP
Real payments/payouts, native video, automated meeting creation, in-app rescheduling, local-time recurring schedule rules/DST (weekly schedules remain explicitly UTC), shared multi-instance rate limiting and self-service account deletion. To move a booking, cancel and rebook; simulated refunds are recorded. Messages poll rather than use WebSockets. No production deployment has been performed.
