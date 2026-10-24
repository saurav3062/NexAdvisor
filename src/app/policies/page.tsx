import Link from "next/link";
export default function Page() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-blue-600 text-sm font-semibold mb-2">
        NexAdvisor · India
      </p>
      <h1 className="text-3xl font-bold mb-3">Terms, privacy & cancellation</h1>
      <p className="text-slate-500 mb-8">
        Pilot policy version 2026-10-17. Payments, refunds and payouts are
        simulated. No real money moves.
      </p>
      <nav
        aria-label="Policy sections"
        className="flex flex-wrap gap-4 text-blue-600 mb-8"
      >
        <a href="#terms">Platform terms</a>
        <a href="#refunds">Cancellations & refunds</a>
        <a href="#privacy">Privacy</a>
        <a href="#contact">Contact</a>
      </nav>
      <div className="space-y-8 leading-relaxed">
        <section
          id="terms"
          className="app-card bg-white border rounded-xl p-6 scroll-mt-28"
        >
          <h2 className="text-xl font-semibold mb-3">Platform terms</h2>
          <p>
            NexAdvisor connects clients with experts for scheduled
            consultations. Provide accurate account and professional
            information, keep your login private, and use messages respectfully.
            Do not impersonate another person, publish misleading credentials,
            or share harmful or unlawful content.
          </p>
          <p className="mt-3">
            Experts are responsible for accurate availability, attending
            appointments, and providing a working Zoom or Google Meet link.
            Profile approval is a platform review, not a guarantee of a
            particular consultation outcome. Clients should choose experts
            appropriate to their needs.
          </p>
          <p className="mt-3">
            A reservation is held for up to 15 minutes and is confirmed after
            simulated payment. An unpaid hold can expire earlier at the
            appointment start. A session is marked completed by the expert after
            it has ended; elapsed time alone does not establish attendance.
          </p>
          <p className="mt-3">
            For new payment records, NexAdvisor’s commission is 25% of the
            consultation price and the expert share is 75%. The simulated
            commission is rounded to the nearest minor currency unit. Existing
            records retain their original commission. Expert payouts are
            reviewed after completion and a 48-hour waiting period; open issues
            pause payout. Live payment processing, tax treatment and actual
            payout timelines will be published before paid launch.
          </p>
        </section>
        <section
          id="refunds"
          className="app-card bg-white border rounded-xl p-6 scroll-mt-28"
        >
          <h2 className="text-xl font-semibold mb-3">
            Cancellations & refunds
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Clients receive a 100% simulated refund when cancelling at least
              one hour before the scheduled start.
            </li>
            <li>
              Within one hour of the start, request cancellation through
              Support. The appointment remains confirmed until support resolves
              it; no automatic refund is promised for late cancellation.
            </li>
            <li>
              Expert cancellations before the start receive a 100% simulated
              refund. For an expert cancellation after the start, report the
              issue to Support.
            </li>
            <li>
              No-shows, failed meetings and disputes are reviewed individually.
              A no-show report does not automatically establish fault or
              entitlement to a payout.
            </li>
            <li>
              Rescheduling requires the other participant’s acceptance at least
              one hour before the current appointment. The original time remains
              booked until acceptance, when availability is checked again. Price
              and duration stay unchanged. Update your calendar after
              acceptance; experts must add a meeting link for the new time.
              Cancellation in NexAdvisor does not cancel the external Zoom/Meet
              meeting.
            </li>
          </ul>
          <Link className="inline-block text-blue-600 mt-4" href="/support">
            Request help with an appointment →
          </Link>
        </section>
        <section
          id="privacy"
          className="app-card bg-white border rounded-xl p-6 scroll-mt-28"
        >
          <h2 className="text-xl font-semibold mb-3">
            Privacy notice for the pilot
          </h2>
          <p>
            We store account and contact details, password hashes, profile
            information and photos, availability, booking records, messages,
            reviews, support cases, policy acceptance and simulated financial
            records to operate the service. Approved expert profiles are public.
            Booking information and messages are available to the participants;
            support and administration functions are restricted to authorized
            operators.
          </p>
          <p className="mt-3">
            Session cookies keep you signed in. Verification and recovery links
            are sensitive. Emails currently use private previews rather than
            external delivery. We do not collect card or bank details in the
            simulator, and do not record Zoom or Google Meet calls. Those
            providers operate their own services and privacy practices.
          </p>
          <p className="mt-3">
            You may edit your profile or close a verified account yourself using
            your current password, once outstanding bookings, disputes and held
            funds are resolved. You can also request assisted account deletion.
            We review outstanding appointments, financial holds and disputes
            first. Processing removes or anonymizes profile details and authored
            content and revokes login access. Transaction references and
            restricted audit history may remain. Backups, operator-held previews
            and third-party meeting data require separate handling; ask support
            about retention and your request. A production retention schedule
            and hosting/provider details must be finalized before public launch.
          </p>
          <Link
            className="inline-block text-blue-600 mt-4"
            href="/privacy-requests"
          >
            Privacy & account deletion requests →
          </Link>
        </section>
        <section
          id="contact"
          className="app-card bg-white border rounded-xl p-6 scroll-mt-28"
        >
          <h2 className="text-xl font-semibold mb-3">Contact NexAdvisor</h2>
          <p>Operating country: India</p>
          <p>
            Support and privacy requests:{" "}
            <a className="text-blue-600" href="mailto:support@nexadvisor.in">
              support@nexadvisor.in
            </a>
          </p>
          <p className="mt-3 text-sm text-slate-500">
            These are pilot operating rules. The operator’s registered
            entity/address, production retention schedule and final policy
            review remain required before public launch.
          </p>
        </section>
      </div>
    </main>
  );
}
