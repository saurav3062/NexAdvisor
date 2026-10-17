# Password recovery, notifications and meetings

## Local preview

Start the backend with the `demo` profile. Email is written to `backend/data/mail-preview/<queue-id>.txt` within roughly 10 seconds. Nothing is sent to an external mailbox. Open these text files to inspect recipients, messages and reset links. The preview directory is ignored by Git and must never be published or served by Next.js. Reset links are short-lived credentials; do not share the preview directory.

Use `/forgot-password` from the sign-in screen. The response is identical for known and unknown email addresses. A registered account receives a single-use link valid for 30 minutes. A new request invalidates previous links and suppresses any pending recovery email. Resetting a password invalidates database-backed sessions; the user must sign in again. Tokens are stored as SHA-256 digests in the recovery table. The delivery queue necessarily holds the reset link until delivery, then clears it; expired secrets are also cleared. Local preview files remain on disk until the developer removes them.

The reset token is in the URL fragment, not its query string, and the page removes it from the address bar after reading it. Refreshing the page requires reopening the email link. No email verification or automatic sign-in is performed by password reset.

## SMTP configuration

Outside demo, mail defaults to `DISABLED`. Set process environment variables before starting Spring Boot:

```
MAIL_MODE=SMTP
PUBLIC_ORIGIN=https://your-nexadvisor-domain.example
MAIL_FROM=your-verified-sender@example.com
SMTP_HOST=your-provider-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-provider-username
SMTP_PASSWORD=your-provider-secret
```

Use a verified sender and your provider's actual values. SMTP requires STARTTLS and an HTTPS public origin. Connection/read/write timeouts are five seconds. Do not commit credentials. Spring does not automatically load the example `.env` file. The demo profile always uses local preview; select the normal profile for real delivery. Real SMTP delivery must be verified with your provider before launch; local preview tests do not verify deliverability or domain DNS configuration.

## Booking email behavior

- A successful simulated payment queues a confirmation for both participants.
- Cancelling a confirmed booking queues a cancellation for both participants. Unpaid/expired holds do not generate cancellation mail.
- Changing a meeting link queues an update for both participants; saving the identical URL does not duplicate it.
- A scheduled scan queues one reminder per participant for confirmed bookings starting within 24 hours. Bookings made within that window receive a reminder on the next scan.

Emails link to the authenticated session page, where users see the latest status and meeting link. They identify payments/refunds as simulated. Confirmation/reminder emails expire when the session starts; meeting updates expire when it ends; cancellation emails expire after 24 hours. Delayed confirmations, reminders and meeting updates are suppressed when a booking is no longer confirmed.

Queue insertion is in the same database transaction as the booking transition. Delivery locks one queue row, attempts delivery, and records success. Failures retry with increasing delays up to five attempts, then remain `FAILED` for inspection. There is no automatic infinite retry. SMTP delivery is at least once: a process crash after the provider accepts a message but before the database commit can cause a duplicate on retry. Booking/payment idempotency remains unchanged.

For operations, inspect `mail_outbox` status, attempts and timestamps without exposing message bodies. Configure alerting for `FAILED` items before deployment. After correcting an SMTP issue, an operator can reset selected non-expired failed rows to `PENDING` with attempts zero and `next_attempt_at=CURRENT_TIMESTAMP`. This may resend mail; review selected IDs first. Do not retry expired reset links—request a new link instead. `DISABLED` leaves ordinary booking notifications queued until enabled or expired; password recovery returns a generic temporary-unavailable error.

## Meetings

Only the assigned expert can set a link on a confirmed booking before its end. Open **Bookings → Manage meeting**, create a meeting in your provider, then paste its link. Clients use **Session details → Open meeting**. Meeting data is accessible only to the two participants and hidden on cancelled/completed bookings.

Supported destinations: HTTPS Google Meet, Zoom (including Zoom subdomains), and Microsoft Teams (`teams.microsoft.com`, `teams.live.com`). Links with embedded usernames, unexpected ports, or other hosts are rejected. The backend never fetches the supplied link. The browser displays its destination and opens it in a new tab without referrer or opener access. These checks validate the destination, not whether a room exists or the expert owns it.

Built-in video, automatic room creation and calendar integration remain separate work.

## Email verification

Registration now queues an email verification link in the same transaction as account creation. If delivery is disabled, registration returns 503 and does not create an unusable account. In demo mode, find the link in the private local mail-preview folder. Links expire after 24 hours, are stored as SHA-256 digests, and require an explicit confirmation button (visiting the page does not consume the token). Tokens travel in the URL fragment, which the page clears after reading.

Unverified users can sign in, recover passwords and manage existing bookings. The backend requires verified email before creating a new booking or saving an expert profile/schedule. Existing accounts start unverified after migration; no address is silently marked verified. Existing approved expert listings and confirmed bookings remain available. Bootstrap administrators remain able to moderate; the verification requirement applies to client booking and expert submission workflows.

The signed-in banner supports resending. The account row is locked and a persisted one-minute cooldown limits resends across instances. A new link replaces the previous token and cancels pending verification emails. Recovery and verification tokens/emails are independent: resetting a password does not verify the account or invalidate its verification link. Completing verification does not sign the user in or change the password. The continue button reloads the account to show its new status.

`POST /api/v1/auth/verify-email` accepts `{token}` and is public but CSRF-protected/rate-limited. `POST /api/v1/auth/resend-verification` requires the account's session and CSRF token, returning 202. Account responses now include `emailVerified`. No public endpoint takes an arbitrary address for resending verification.

## Endpoints

`POST /api/v1/auth/forgot-password` accepts `{email}` and returns 202. `POST /api/v1/auth/reset-password` accepts `{token,password}`. Both are public but CSRF-protected and rate-limited. Passwords must be 10–128 characters. `GET /api/v1/bookings/{id}/meeting` returns `{url}`; `PUT` accepts `{url}` and requires the booked expert. Empty `url` from GET means no accessible link.
