# Real appointment pilot, simulated external services

Appointments and availability are persisted. Payments/refunds and outbound emails
remain simulated. Meetings happen on the expert's own Zoom or Google Meet account.
The original interface and backend architecture are retained.

## Operator setup

Use PostgreSQL for hosted appointments and the deployment guide for HTTPS, backups
and private API access. The local demo uses its existing H2 file. Do not run tests
against either live database. Bootstrap an administrator and approve only actual
experts. Review rates, weekly hours and the expert’s named timezone, and time off before invitations.

Email verification is still required; simulation does not bypass identity gates.
Preview messages are saved in `backend/data/mail-preview` locally or the private
`mail-previews` volume in Compose. An operator must give each pilot participant
only their own verification/reset link through a trusted private channel after
checking their identity. No email or push reminder reaches the participant.
Never publish the preview directory. This is an assisted pilot onboarding flow.

## Appointment flow

1. Client chooses the expert and slot in the expert’s timezone, checks the displayed local time, then
   reserves it. The client and expert cannot have overlapping active reservations.
2. The reservation lasts up to 15 minutes, capped at the session start. The client
   confirms through simulated payment. No card details or real money are involved.
   Expired reservations cannot be paid and are released automatically.
3. The expert creates an actual Zoom or Google Meet meeting and pastes the join
   URL into **Manage meeting** on the confirmed booking. Use Google Meet's full
   `https://meet.google.com/abc-defg-hij` format or Zoom's `/j/meetingId` or `/my/name`
   link. Zoom passcode query parameters are preserved. An arbitrary provider home
   page, sign-in page or redirect link is not a meeting link.
4. Both participants open session details to join. Confirm the provider's waiting
   room, passcode and admission settings before the appointment. NexAdvisor does
   not generate meeting links, grant provider access or record calls.
5. After the scheduled end, the expert marks the appointment completed only if
   it took place. The client can then leave one review. Time passing alone never
   claims attendance. Meeting access in the app closes at the scheduled end;
   a saved provider URL is controlled by Zoom/Meet, not NexAdvisor.

Either participant can cancel before the start; confirmation is required in the
interface and any refund is simulated. To move an appointment, cancel and rebook.
The expert must separately cancel/update the external meeting. For an absence,
late cancellation, or dispute after the start, coordinate through booking messages
and the pilot operator; there is no automated attendance or dispute-resolution flow.

## What has protection

- Participant ownership and role checks on private booking and meeting actions.
- Shared participant locks for overlapping bookings and competing state changes.
- Idempotent reservation retries and simulated payment/refund actions.
- Time-off conflicts, expired holds, premature completion and invalid meeting URLs.
- No editing booking inputs while the reservation request is in progress.

## Before inviting participants

Run a full client/expert practice appointment with an actual Zoom/Meet call on
the intended phones and computers. Confirm the domain, session cookies, private
preview access and restore procedure. Agree on attendance/cancellation handling
with participants. Tests do not verify external meeting availability or replace
the deployment checks. This is not a real-money or unattended public launch.
