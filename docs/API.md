# API v1

Updated 24 October 2026. See [architecture](ARCHITECTURE.md) for authorization and transaction rules.

All paths below are relative to `/api/v1`. JSON requests and responses. Send cookies with requests. Before POST/PUT/DELETE, GET `/csrf` and send the returned `token` under the returned `headerName`. Refresh after login/logout. Error responses use an HTTP status and message; 400 validation, 401 signed out, 403 forbidden/CSRF, 404 absent or inaccessible, 409 conflict, 429 throttled, 503 temporarily unavailable, 500 unexpected failure. API advice responses include `{message,code,requestId}` and the X-Request-ID header; security/proxy failures may return a different body. Never automatically replay a failed write.

| Area | Endpoints |
| --- | --- |
| Public configuration | GET `/config`, `/categories` |
| Directory | GET `/experts?category=&search=&min=0&max=1000000&sort=rating&limit=20&offset=0` |
| Expert | GET `/experts/{id}`, `/experts/{id}/reviews`, `/experts/{id}/availability?date=YYYY-MM-DD&duration=60` |
| Auth | POST `/auth/register`, `/auth/login`, `/auth/logout`; GET `/auth/me` |
| Recovery | POST `/auth/forgot-password` with `{email}`; POST `/auth/reset-password` with `{token,password}` |
| Verification | POST `/auth/verify-email` with `{token}`; POST `/auth/resend-verification` using the signed-in session |
| Meeting | GET `/bookings/{id}/meeting`; PUT with `{url}` (booked expert only) |
| Profile | PUT `/me/profile`; GET/PUT `/me/expert`, `/me/availability` |
| Moderation | GET `/admin/experts`; POST `/admin/experts/{id}/review` |
| Booking | POST `/bookings`; GET `/me/bookings?offset=0`, `/bookings/{id}` |
| Booking actions | POST `/bookings/{id}/simulate-payment`, `/cancel`, `/complete` (full booking prefix for each) |
| Payments | GET `/me/payments?offset=0` |
| Conversation | GET `/bookings/{id}/messages?offset=0`; POST `/bookings/{id}/messages` |
| Review | POST `/bookings/{id}/review` |
| Favorite | GET/PUT/DELETE `/me/favorites/{expertId}` |

Register: `{email,password,name,role,policyVersion:"2026-10-17"}` where role is `client` or `expert`. Login: `{email,password}`. Expert profile: `{categoryId,title,bio,hourlyRateMinor,yearsExperience}`. Availability: `{days:[{dayOfWeek,startMinute,endMinute}],timezone:"Asia/Kolkata"}` with Monday=1, one interval per day and half-hour boundaries. The availability query date is a date in the expert timezone, not necessarily the viewer timezone. Review decision: `{decision:"APPROVED"|"REJECTED",note}`.

Booking: `{expertId,startsAt,durationMinutes,notes,requestKey}`. Times are ISO UTC instants and the key is a UUID. Store/reuse the key for a retry of the same payload. The response provides `amountMinor`, `currency`, `status`, `paymentStatus` and `expiresAt`. Message: `{content,requestKey}`; current UI supplies a UUID retry key (optional for older clients). Reuse it only for identical content/booking. Review: `{rating,comment}` with rating 1–5. Profile: `{name,bio,location}`.

`SIMULATED_PAID` and `SIMULATED_REFUNDED` represent no movement of money. The payment endpoint refuses requests when simulation is disabled. The UI never asks for card data.

## MVP additions
- `GET /me/favorites?offset=0`: approved saved profiles, 100 per page. Existing per-expert GET/PUT/DELETE routes remain; users may remove saved entries even if the profile is no longer published.
- `GET /me/booking-counts`: status counts across the signed-in participant’s full booking history.
- `GET /me/time-off`: current/future expert blocks, at most 200.
- `POST /me/time-off`: `{startsAt, endsAt}` UTC instants. Verified expert/profile required. Future range within a year; conflicting active reservations or blocks return 409. Locks serialize changes with booking creation.
- `DELETE /me/time-off/{id}`: owning expert only; missing/not-owned blocks return 404 (non-expert role returns 403).
- Availability responses mark blocked slots unavailable; booking creation revalidates under the expert account lock.
- Authenticated lists retain their existing 100-record offset pages; frontend Load more controls now expose them. All new private mutations retain CSRF protection.


## Profile photos and dashboard

- `PUT /me/expert/photo`: `{data}` containing raw base64 JPEG/PNG bytes (not a data URL); empty string removes the photo. At most 2 MB decoded; image is normalized server-side.
- `GET /experts/{id}/photo`: JPEG bytes; public only for approved profiles, otherwise owner/admin. This endpoint is not JSON.
- `GET /me/upcoming-bookings`: next active appointments for the participant.
- `GET /me/readiness`: `{missingLinks,rescheduleRequests}` for the current participant, bounded to 100 items per list.

## Rescheduling

All routes below use `/bookings/{bookingId}/reschedule` as prefix and require participant ownership.

| Method / suffix | Payload / result |
| --- | --- |
| GET (base) | Latest 20 proposals |
| GET `/context` | Current booking and expert timezone |
| GET `/slots?date=YYYY-MM-DD` | Target slots for the existing duration and price |
| POST (base) | `{requestKey,originalStart,proposedStart}`; UTC instants and UUID key |
| POST `/{proposalId}` | `{accept:true}` for the other participant; `{accept:false}` declines/withdraws |

Only confirmed simulated-paid appointments at least an hour before start are eligible, with active participants and no open support case. Proposal does not reserve the target. Acceptance revalidates conflicts, clears the old meeting link and preserves the booked amount/duration.

## Support, settlements and operations

| Method / route | Payload or purpose |
| --- | --- |
| GET `/me/support?offset=0` | Current account's reports |
| POST `/me/support` | `{bookingId,category,description}`; category NO_SHOW, LATE_CANCELLATION, FAILED_MEETING, DISPUTE or OTHER |
| GET `/admin/support?offset=0` | All reports, admin only |
| POST `/admin/support/{id}/resolve` | `{outcome,note}`; FULL_REFUND, NO_REFUND, NO_SHOW, CLIENT_NO_SHOW, EXPERT_NO_SHOW, ATTENDED or REOPEN |
| GET `/me/settlements?offset=0` | Expert earnings snapshots |
| GET `/admin/settlements?offset=0` | All settlements |
| POST `/admin/settlements/{bookingId}/simulate-payout` | Eligible completed paid session, 48-hour delay, no open case |
| GET `/admin/reconciliation` | Internal simulation consistency and totals, not bank reconciliation |
| GET `/admin/operations` | Failed mail, issues, deletion/readiness counts and launch evidence |
| POST `/admin/launch-checks/{key}` | `{note}`; allowed key from OperationsService.check |
| POST `/admin/unpublish-demo` | Retire known demo profiles |

Attendance outcomes require an ended confirmed appointment. No-show cancels without automatically refunding/paying; resolve funds separately. Validation lengths are defined in OperationsController records.

## Account control and privacy

| Method / route | Payload or purpose |
| --- | --- |
| GET `/admin/accounts?search=&offset=0` | Account search |
| POST `/admin/accounts/{id}/restriction` | `{suspended,note}` |
| GET `/admin/audit?offset=0` | Operator actions |
| GET / POST `/me/deletion-requests` | List own request / create with `{reason}` |
| GET `/admin/deletion-requests?offset=0` | Assisted deletion queue |
| POST `/admin/deletion-requests/{accountId}/review` | `{note}` |
| POST `/admin/deletion-requests/{accountId}/anonymize` | `{note}`, reviewed request and no obligations |
| POST `/me/close-account` | `{password,confirmation:"DELETE"}`; verified non-admin account, no active bookings/open issues/held settlements |

Closure anonymizes data and invalidates the session. It does not remove every historical financial/audit record or external backup.

## Cashfree callback boundary

`POST /webhooks/cashfree` is the only CSRF-exempt mutation. It reads the exact raw request body (maximum 64 KiB), validates x-webhook-timestamp/x-webhook-signature with the configured secret and deduplicates a SHA-256 body digest. Response: `{status:"VERIFIED_NOT_APPLIED",duplicate:boolean}`. The timestamp is format-checked, not freshness-checked. No live payment or booking transition occurs. Do not use this receipt endpoint as evidence that live checkout is implemented.

## Contract maintenance

Controller annotations and DTO records are authoritative; this is a hand-maintained route guide, not generated OpenAPI. Update this file when changing routes/payloads and update `src/lib/nexadvisor-api.ts` types together. Authenticated paginated lists generally return arrays of up to 100 with offsets 0–10000; specific endpoints above have their own limits. Never assume pagination metadata or an unbounded history export.
