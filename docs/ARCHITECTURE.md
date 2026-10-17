# Architecture

## Boundaries

The browser uses `/api/v1` on the Next.js origin. Next rewrites those requests to the private Spring Boot server. Session cookies are HTTP-only, SameSite=Lax; Spring Session stores sessions in the database. Mutations require a CSRF token obtained from `/csrf`. Login replaces the previous session and the client fetches a fresh token. Passwords use Spring Security PBKDF2.

Controllers deserialize and validate DTOs, resolve the authenticated account, and call services. Services enforce ownership, roles, availability, prices and state transitions. Transaction boundaries belong to services. Repositories own SQL and row mapping. Entity records are immutable data, not JPA entities. Schema changes are new Flyway migrations; never edit applied migrations.

Account roles are CLIENT, EXPERT and ADMIN. Public registration cannot create administrators. Experts submit a profile and schedule; an administrator approves or rejects the profile with an audit note. Profile edits require approval again. Private review notes are removed from public expert responses.

## Booking invariants

All scheduling is UTC with half-hour boundaries and 30/60 minute sessions, within 90 days. Prices are calculated on the server from the expert's rate using integer minor units, rounded up for fractional cents. Current currency is USD.

Creation locks both participant account rows in stable UUID order. Overlap checks include both expert and client calendars. Payment, cancellation, completion and expiry use the same participant locks. This serializes conflicting operations across application instances. A client-supplied UUID request key makes creation retryable; reuse with different details returns 409.

PENDING holds expire after 15 minutes. Availability ignores expired holds immediately. A scheduled job records their cancellation every minute. Payment validates the hold again under lock. CONFIRMED sessions can be completed only by their expert after the session ends. Either participant can cancel a future session. Completed sessions cannot be cancelled.

Simulation inserts one payment per booking and confirms it in one transaction. Retrying payment returns the paid booking. Cancelling a paid booking records SIMULATED_REFUNDED in the same transaction; repeated cancellation is safe. No real provider, bank details or payout implementation exists. Simulation defaults off except in the demo profile.

Messages are restricted to the booking participants. Only a client of a completed booking can post one review; the database enforces uniqueness. Ratings come from stored reviews. List endpoints use bounded pagination.

## Extending the application

Add request validation in DTOs, authorization and business rules in services, SQL only in repositories, and a migration for schema changes. Add integration tests for invariants and failure cases. Keep frontend business features under `src/features` and use the shared API client instead of direct fetch calls. Keep provider integration behind a future payment service boundary, preserve idempotency, and never accept client-calculated prices.

The local login/recovery/verification throttle is bounded and per process. Verification resend also has a persisted per-account cooldown. A multi-instance deployment needs a shared request limiter. The fixed weekly UTC schedule has no holidays or calendar exceptions yet. Account deletion, built-in video calling and production operations are separate work items.

Recovery stores one token digest per account, locks the account for issuance/consumption, and revokes persisted sessions when changing the password. Communication services queue email in the booking transaction; a separate delivery worker handles provider calls and bounded retries. Meeting services restrict updates to the booked expert and reads to participants. See COMMUNICATIONS.md for retention, retry semantics, supported meeting providers and configuration.
