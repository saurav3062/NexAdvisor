# NexAdvisor developer handbook

Code walkthrough updated 24 October 2026. Start here to understand the product; use the [Developer SOP](DEVELOPER-SOP.md) to run it.

## Reading order

1. This handbook: product, roles, feature ownership and extension workflow.
2. [Architecture](ARCHITECTURE.md): request paths, transactions, concurrency and state machines.
3. [Data model](DATA-MODEL.md): relationships, constraints and migration history.
4. [API reference](API.md): routes, payloads and error conventions.
5. [Communications](COMMUNICATIONS.md), [launch operations](LAUNCH-OPERATIONS.md) and [launch gate](LAUNCH-GATE.md): integration limits and operational responsibilities.
6. [Verification history](VERIFICATION.md): checks actually executed, with dates and limitations.

## 1. What the application does

NexAdvisor is an expert-consultation marketplace. Clients discover approved experts, reserve 30/60-minute consultations, confirm them through simulated payment, communicate and meet through an external meeting link. Experts maintain profiles, photos, weekly hours and time off. Administrators moderate experts, resolve booking issues, oversee simulated settlements and handle account controls.

The intended business context is NexAdvisor, India, with support at support@nexadvisor.in. New expert prices default to INR; money is stored in integer minor units. The default commission is 25%. Historical records retain their recorded currency and commission; do not relabel or recalculate them using today's settings.

This repository implements a simulated-payment pilot. Real card collection, bank transfers and live Cashfree transaction processing are not enabled. Email defaults to private previews in the provided launchers; SMTP transport exists but must be configured and tested. Zoom/Google Meet calls happen on those providers; the app does not host video, create meetings automatically or prove attendance. The URL validator also accepts supported Microsoft Teams links.

## 2. Roles and journeys

| Actor | Main responsibilities | Important boundaries |
| --- | --- | --- |
| Visitor | Browse published experts, reviews, categories and availability; register | Cannot see private bookings, messages or pending profiles |
| CLIENT | Verify email, maintain profile, reserve/pay, reschedule, message, review, report issues, close account | Only their own bookings; reviews require a completed appointment |
| EXPERT | Verify email, submit profile/photo, set hours/timezone/time off, supply meeting link, complete appointments, inspect earnings | Cannot approve own profile or simulate client payment |
| ADMIN | Review experts, manage support and accounts, inspect reconciliation, simulate payouts, record launch evidence | Not available through public registration; actions require server-side authorization |

Client journey: signup → login → email verification → directory/profile → slot selection → unpaid hold → simulated payment → confirmed booking → meeting/message → completion → optional review. Cancellation and support branch from this path.

Expert journey: signup → verification → professional profile and photo → weekly availability/timezone → admin review → public discovery → confirmed appointment → add provider meeting link → conduct meeting → mark completed → payout review. Profile/photo updates require reapproval. Schedule changes do not silently move existing appointments.

Admin journey: bootstrap once → remove bootstrap credentials from configuration → approve real experts → monitor missing links, failed mail and issues → record attendance/refund decisions → release eligible simulated payouts → handle restrictions/deletion and launch checks.

## 3. Codebase map

| Location | Responsibility |
| --- | --- |
| `src/app/` | Next.js App Router pages, layout, provider composition, loading/error/not-found views |
| `src/screens/` | Landing, login, signup and explanatory screens |
| `src/features/` | Product UI grouped by account, experts, bookings, conversations, payments, admin and operations |
| `src/components/` | Shared visual elements, navigation and client route guard |
| `src/contexts/AuthContext.tsx` | Session bootstrap, login/logout, account view and query-cache cleanup |
| `src/lib/nexadvisor-api.ts` | API types, cookie requests, CSRF acquisition, timeouts and errors |
| `src/lib/calendar.ts`, `timezones.ts` | Calendar export and timezone presentation helpers |
| `backend/src/main/java/com/nexadvisor/` | Spring application, controllers, services, repositories, immutable records, jobs and security |
| `backend/src/main/resources/db/migration/` | Authoritative incremental schema history |
| `backend/src/test/` | Integration, scheduling, error, job-isolation and database-guard tests |
| `scripts/` | Startup, deployment validation, frontend regression checks and operations jobs |
| `deploy/` | Compose, Debian guidance, Nginx/systemd/backup/monitor templates |
| `legacy/` | Former mock/Supabase implementation; reference only, not the active backend |

Versions are pinned by package manifests/lockfiles. Current manifests specify Next.js 16.3.4, React 19, TypeScript and TanStack Query; Spring Boot 4.1.1 targets Java 21. PostgreSQL 17 is used in deployment and H2 in local demo/tests. There is no JPA ORM, Redis or external message broker in this design.

## 4. Feature-to-code navigation

Backend names below live under `backend/src/main/java/com/nexadvisor/`; frontend names under `src/`.

| Feature | Frontend | Backend starting point |
| --- | --- | --- |
| Login/signup/session | `screens/`, `contexts/AuthContext.tsx` | `controller/AccountController.java`, `service/AccountService.java`, `security/SecurityConfig.java` |
| Recovery/verification | `features/account/` | `PasswordRecoveryService`, `EmailVerificationService` |
| Expert discovery/editor | `features/experts/` | `ExpertController`, `ExpertService`, `ExpertRepository` |
| Photo upload | `features/experts/PhotoEditor.tsx` | `ExpertPhotoController`, `ExpertPhotoService` |
| Availability/time off | `features/experts/ExpertEditor.tsx`, `TimeOff.tsx` | `ScheduleTimes`, `BookingService.slots`, `TimeOffService` |
| Booking/confirmation | `features/experts/ExpertDetail.tsx`, `features/bookings/Bookings.tsx` | `BookingService`, `PaymentService`, `BookingRepository` |
| Rescheduling | `features/bookings/Reschedule.tsx` | `ReschedulingController`, `ReschedulingService` |
| Meeting readiness | `features/bookings/MeetingReadiness.tsx` | `ReadinessController`, `MeetingService`, `BookingNotificationService` |
| Messages/reviews | `features/conversations/` | `ConversationService`, `ConversationRepository` |
| Support/admin/earnings | `features/operations/` | `OperationsController`, `OperationsService`, `FinanceRepository` |
| Restrictions/closure | `features/operations/AccountControls.tsx`, `PrivacyRequests.tsx` | `AccountControlService`, `OperationsService.selfErase` |
| Email | API-triggered notifications | `MailDeliveryService`, `MailRepository`, `jobs/CommunicationJobs` |
| Cashfree seam | No live checkout | `CashfreeWebhookController`, `CashfreeWebhookVerifier` |

## 5. Frontend design and state

Route files are generally thin entries into feature components. The root layout installs Providers: TanStack Query, AuthProvider, error boundary, shared navigation, verification/offline banners and toast feedback. Most application data is fetched from the browser through the same-origin API, rather than a second business layer in Next.js route handlers.

Use the shared `api<T>()` helper. It includes cookies, fetches/caches a CSRF token, imposes a 20-second timeout, handles non-JSON proxy failures and exposes ApiError status/reference. AuthContext loads `/auth/me`, maps uppercase server roles to lowercase UI roles, clears cached private data when sessions change and distinguishes an unavailable server from a signed-out user. The client route guard is a presentation aid; backend ownership/role checks are the security boundary.

TanStack Query owns server data. Default stale time is five minutes, with window-focus refetch and at most one retry for network/server failures; mutations do not automatically retry. Feature mutations invalidate relevant queries. Messages poll; there is no WebSocket service. Keep local form state separate from cached server state. During a failed write, the server may already have committed: preserve retry keys and check current state before retrying.

The API owns price, eligibility, availability and state transitions. A disabled button is helpful UI, never authorization. Use UTC instants for transport and format for the viewer; recurring availability belongs to the expert's named timezone. Preserve the existing visual language rather than introducing a second design system.

## 6. Operations and privacy

Support cases cover no-show, late cancellation, failed meeting, dispute and other issues. Operators can record attendance outcomes, reopen cases or approve full simulated refunds. A no-show does not automatically forfeit funds or pay the expert; it cancels and keeps funds held for separate resolution. One report per participant per booking is enforced.

Restrictions revoke sessions and unpublish the expert. Reinstatement does not automatically republish the profile. Existing bookings need explicit resolution; account restriction is not a mass cancellation command.

Self-service closure requires verified email, current password and typed `DELETE`. Active bookings, open issues and held settlements block erasure. Admin-assisted requests have a review step. Erasure anonymizes the account and selected authored content while retaining financial/audit relationships. It is not physical deletion of every record, log, email preview, external provider copy or backup. Handle those retention obligations operationally.

Photos are submitted as base64 JPEG/PNG, limited to 2 MB decoded and 4096×4096 source dimensions. The server crops/re-encodes to 384×384 JPEG, discarding source metadata. Images are stored in the database and served through a controlled endpoint, not a public filesystem upload directory.

## 7. How to extend a feature safely

1. Read its service, repository, DTO, migration and existing integration tests before changing the UI.
2. Define the actor, allowed states, validation, retry behavior, time boundary and conflicting operations. Decide which account/participant locks protect the write.
3. Add a new Flyway migration for schema changes; never edit a migration already applied anywhere. Preserve historical price, currency and commission snapshots.
4. Put request validation at the HTTP boundary and business authorization in the transactional service. Prefer repository-owned SQL; some operational services/controllers currently use JdbcClient directly (see architecture).
5. Add/update API types and feature UI through the shared client. Invalidate affected query caches and provide loading, empty, failure and retry states.
6. Test forbidden actors, duplicate/stale requests, concurrent writes and boundary times on H2 and PostgreSQL as appropriate. Use only disposable test databases.
7. Update the API/data-model docs and run the SOP checks. Record actual verification rather than promising all edge cases are covered.

Example: a new cancellation reason belongs in the request contract and a new migration if persisted, then in the service/audit flow and UI. It must preserve participant locks, the one-hour rule, refund idempotency, notification invalidation and completed-booking protection.

## 8. Integration and scaling limits

Cashfree currently verifies signed raw-body callbacks and deduplicates receipt hashes only. It returns VERIFIED_NOT_APPLIED and does not change bookings or balances. Live orders, capture/refund/payout state machines and provider reconciliation remain work; credentials alone do not complete that integration.

SMTP sends happen outside the originating booking transaction but inside the delivery method's database transaction. A crash after provider acceptance but before commit can cause duplicate mail on retry. Exactly-once external delivery is not guaranteed. Multi-instance sessions, account locks and authentication counters use the database, but that does not establish tested horizontal capacity: review job contention, scheduling, pool sizing and provider semantics before scaling.

Use [LAUNCH-GATE.md](LAUNCH-GATE.md) for public-launch requirements. Documentation, successful local tests and container health do not replace hosted TLS, restore, delivery, load/security and physical-device acceptance.


## 9. Configuration ownership

| Setting / source | Meaning | When it takes effect |
| --- | --- | --- |
| `BACKEND_URL` / next.config.mjs | Private API destination for `/api/v1` rewrites | Frontend build; rebuild after change |
| `PUBLIC_ORIGIN` | Public application origin for generated links and deployment checks | API process startup |
| `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` | JDBC connection | API startup; local launcher explicitly selects demo profile |
| `COOKIE_SECURE` | HTTPS-only session cookie | API startup; true in deployed Compose |
| `PAYMENT_SIMULATION_ENABLED` | Permit simulated payment actions | API startup; false by default, true in supplied launchers |
| `COMMISSION_BPS` | Fee for new finance snapshots, default 2500 | API startup; does not rewrite existing snapshots |
| `MAIL_MODE`, `MAIL_FROM`, `SMTP_*` | DISABLED/PREVIEW/SMTP transport and sender configuration | API startup; Compose currently sets PREVIEW |
| `CASHFREE_WEBHOOK_SECRET` | Receipt signature verification only | API startup; does not enable live checkout |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial admin bootstrap | Startup; remove after first login |
| `.env.local` | Local launcher ports/bootstrap settings | Local launcher reads it |
| `deploy/.env` | Private Compose deployment settings | Deployment wrapper reads it |
| `/etc/nexadvisor/ops.env` | Host backup/monitor credentials | Configured systemd operations jobs |

Spring does not automatically read project `.env` files. Inspect application.properties, application-demo.properties, MailSettings and the launch scripts when tracing configuration precedence. Keep all credentials server-side; never put them in NEXT_PUBLIC variables. The optional `nexadvisor.jobs.enabled=false` disables booking/communication scheduled components for tests; AuthThrottle cleanup is separate.

## 10. Suggested first-day walkthrough

Run local mode using the SOP, create disposable client/expert accounts, inspect private verification previews, submit and approve an expert, then follow one booking through the UI. In code, read ExpertDetail → shared api helper → BookingController → BookingService → BookingRepository → V1/V2/V12. Repeat for payment, then study ReschedulingService and its integration tests. Finally inspect the admin support and account closure paths before touching financial or identity behavior.

For every change, keep the handbook/API/data model aligned with behavior. Dates and test counts in VERIFICATION.md are historical evidence, not a claim that a new checkout has already passed CI.
