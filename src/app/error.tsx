"use client";
import Link from "next/link";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section role="alert" className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">
        This page couldn’t load
      </h1>
      <p className="mt-3 text-slate-600">
        Try loading it again. If you were confirming a booking, check your
        bookings before creating another reservation.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={retry}
          className="rounded-lg bg-blue-600 px-5 py-3 text-white"
        >
          Try again
        </button>
        <Link
          href="/bookings"
          className="rounded-lg border border-slate-200 px-5 py-3"
        >
          My bookings
        </Link>
      </div>
    </section>
  );
}
