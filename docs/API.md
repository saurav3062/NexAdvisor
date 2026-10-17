# API v1

All paths below are relative to `/api/v1`. JSON requests and responses. Send cookies with requests. Before POST/PUT/DELETE, GET `/csrf` and send the returned `token` under the returned `headerName`. Refresh after login/logout. Error responses use an HTTP status and message; 400 validation, 401 signed out, 403 forbidden/CSRF, 404 absent or inaccessible, 409 conflict, 429 throttled.

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

Register: `{email,password,name,role}` where role is `client` or `expert`. Login: `{email,password}`. Expert profile: `{categoryId,title,bio,hourlyRateMinor,yearsExperience}`. Availability: `{days:[{dayOfWeek,startMinute,endMinute}]}` with Monday=1 and one interval per day. Review decision: `{decision:"APPROVED"|"REJECTED",note}`.

Booking: `{expertId,startsAt,durationMinutes,notes,requestKey}`. Times are ISO UTC instants and the key is a UUID. Store/reuse the key for a retry of the same payload. The response provides `amountMinor`, `currency`, `status`, `paymentStatus` and `expiresAt`. Message: `{content}`. Review: `{rating,comment}` with rating 1–5. Profile: `{name,bio,location}`.

`SIMULATED_PAID` and `SIMULATED_REFUNDED` represent no movement of money. The payment endpoint refuses requests when simulation is disabled. The UI never asks for card data.

## MVP additions
- `GET /me/favorites?offset=0`: approved saved profiles, 100 per page. Existing per-expert GET/PUT/DELETE routes remain; users may remove saved entries even if the profile is no longer published.
- `GET /me/booking-counts`: status counts across the signed-in participant’s full booking history.
- `GET /me/time-off`: current/future expert blocks, at most 200.
- `POST /me/time-off`: `{startsAt, endsAt}` UTC instants. Verified expert/profile required. Future range within a year; conflicting active reservations or blocks return 409. Locks serialize changes with booking creation.
- `DELETE /me/time-off/{id}`: owning expert only; missing/not-owned blocks return 404 (non-expert role returns 403).
- Availability responses mark blocked slots unavailable; booking creation revalidates under the expert account lock.
- Authenticated lists retain their existing 100-record offset pages; frontend Load more controls now expose them. All new private mutations retain CSRF protection.
