# Launch gate — 19 October 2026

The application supports the complete simulated booking lifecycle. This is not a certification that every possible edge case has been eliminated. Public paid launch depends on real provider integration and acceptance on the target Debian host.

## Reliability behavior

- Reservation and payment operations serialize conflicting bookings. Booking request keys still identify the original operation after a reschedule.
- Message submissions carry retry keys. Repeating the same request cannot create a second message; reusing a key for different content is rejected.
- Cancellation closes outstanding reschedule requests and expires stale queued meeting/reschedule notices.
- Restricted/deleted accounts cannot use old verification/reset links. Profile, schedule, photo, time-off and booking writes recheck access after acquiring account locks.
- Authentication limits are shared in PostgreSQL, survive application restarts and use atomic increments across instances. The fixed window permits 30 attempts per key per 15 minutes. Proxy limits remain necessary for overall traffic protection.
- API responses include a server-generated X-Request-ID. Errors return safe messages without SQL, credentials or stack traces. Database contention/outages return retryable service errors when handled by the API advice. Server logs identify the reference, failure class and code location.
- Frontend requests time out after 20 seconds. Failed writes are never automatically replayed: the user is told the result may have been saved and to check current state. Read failures get at most one query retry; validation/auth failures are not retried. Offline status is visible.
- Scheduled delivery, reminders and hold expiry isolate each item so one failure does not stop later items. Failed items remain subject to the existing retry/expiry rules; delivery is not guaranteed during an outage.
- Integration tests refuse file-backed H2 and PostgreSQL databases other than the explicitly disposable `nexadvisor_test` before migration or cleanup. Never store real data in that test database.

## Provider integration boundary

Payments and email remain simulated by default. The money ledger, commission snapshots, refund rules, payout holds, audit records and signed Cashfree receipt deduplication are present. Cashfree callbacks currently record receipts only; they do not authorize a real payment.

Before live money, implement and test Cashfree order creation, verified settlement transitions, refund execution/status, payout execution/status and reconciliation. Cover duplicate, delayed and reordered callbacks; provider timeouts; failed/partial refunds; and disputed transactions. A browser redirect must never be treated as payment confirmation. Do not enable live money by merely adding credentials to the simulated payment flow.

SMTP transport exists, but configure and verify actual delivery, sender-domain authentication, password-reset/verification URLs and operational handling of delivery failures before public signup. Never expose private preview mail or verification tokens.

## Debian acceptance gate

1. Configure the real HTTPS origin and secure cookies using `deploy/debian/README.md`. Build/start with `npm run deploy -- up`; verify private API/database ports and reboot recovery.
2. Enable the supplied monitoring and off-host backup jobs. Trigger an alert and restore a backup into an isolated environment; check login and bookings there. Template files alone do not establish monitoring or recovery.
3. Complete a real client/expert/admin journey on the hosted domain: registration, verification, approval, availability, booking, reschedule, meeting link, messages, cancellation/refund, support resolution and account closure.
4. Test Zoom/Meet admission and timezone display on physical Android/iOS and desktop devices with actual approved experts. No fictional profiles should be published as real experts.
5. Finish business/policy review, support ownership and retention decisions. Run a representative load test and security review on staging before promoting a public paid service.

Local console startup remains `npm start`; `npm run start:fast` reuses successful builds. Back up before V12 or any future migration. See `VERIFICATION.md` for executed checks and their limits.
