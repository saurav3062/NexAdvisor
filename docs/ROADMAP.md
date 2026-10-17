# Product status

The simulated-payment pilot feature set is implemented. See [MVP acceptance and launch handoff](MVP-READINESS.md) for the exact scope, repeatable checks, and remaining public-launch prerequisites.

Added in the MVP completion pass: persisted saved experts; expert time off with ownership and booking-conflict protection; load-more controls; full-account booking counts; local-time booking preview; calendar export; truthful demo signup copy; and repeatable CI configuration.

The core flows retain session authentication, verification/recovery, expert approval, availability, bookings, simulation/refunds, messages, reviews, meetings and queued notifications. See COMMUNICATIONS.md for preview/SMTP setup.

A tested local pilot is not a deployed public service. SMTP delivery, hosting, policy decisions, backup restoration and operational controls still require deployment-specific acceptance. Payments remain simulated by design.
