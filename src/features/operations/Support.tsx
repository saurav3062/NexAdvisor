"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type Booking } from "@/lib/nexadvisor-api";

import { usePaged, LoadMore } from "@/features/shared/Pagination";

import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";

export interface SupportCase {
  id: string;
  bookingId: string;
  category: string;
  description: string;
  status: string;
  response: string;
  resolution: string;
  createdAt: string;
}

export function Support() {
  const search = useSearchParams();
  const [bookingId, setBooking] = useState(search.get("booking") || "");

  const [category, setCategory] = useState("FAILED_MEETING"),
    [description, setDescription] = useState("");

  const cache = useQueryClient();

  const cases = usePaged<SupportCase>(["support"], "/me/support");

  const bookings = usePaged<Booking>(["support-bookings"], "/me/bookings");

  const submit = useMutation({
    mutationFn: () =>
      api("/me/support", "POST", { bookingId, category, description }),
    onSuccess: () => {
      setDescription("");
      cache.invalidateQueries({ queryKey: ["support"] });
    },
  });

  return (
    <Workspace title="How can we help?">
      <p className="mb-6 text-slate-600">
        Report a missed appointment, meeting problem, or request a cancellation
        review. Your report is private to you and our support team. Contact{" "}
        <a className="text-blue-600" href="mailto:support@nexadvisor.in">
          support@nexadvisor.in
        </a>
        .
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className={card + " space-y-4"}
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <h2 className="text-xl font-semibold">Tell us what happened</h2>
          <QueryState loading={bookings.isLoading} error={bookings.error} />

          <label className="block">
            Appointment
            <select
              required
              className={input}
              value={bookingId}
              onChange={(e) => setBooking(e.target.value)}
            >
              <option value="">Choose an appointment</option>
              {bookingId && !bookings.data?.some((b) => b.id === bookingId) && (
                <option value={bookingId}>
                  Selected appointment · {bookingId.slice(0, 8)}
                </option>
              )}
              {bookings.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.expertName} · {new Date(b.startsAt).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
          <LoadMore query={bookings} />

          <label className="block">
            Issue
            <select
              className={input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                ["FAILED_MEETING", "Meeting link or connection problem"],
                ["NO_SHOW", "Someone did not attend"],
                ["LATE_CANCELLATION", "Late cancellation request"],
                ["DISPUTE", "Booking or payment dispute"],
                ["OTHER", "Something else"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            Details
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              className={input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <p className="text-sm text-slate-500">
            Do not include passwords, card details, or identity documents. One
            case per participant per appointment; contact support with your case
            reference for follow-up.
          </p>

          <button className={button} disabled={submit.isPending}>
            {submit.isPending ? "Sending…" : "Send to support"}
          </button>
          {submit.error && (
            <p role="alert" className="text-red-600">
              {submit.error.message}
            </p>
          )}
          {submit.isSuccess && (
            <p role="status" className="text-green-700">
              Your case is recorded. Check below for a response.
            </p>
          )}
        </form>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Your requests</h2>
          <QueryState loading={cases.isLoading} error={cases.error} />
          {cases.data?.length === 0 && <p>No requests yet.</p>}
          {cases.data?.map((c) => (
            <article key={c.id} className={card}>
              <p className="text-xs text-slate-500 break-all">Case {c.id}</p>
              <h3 className="font-semibold mt-2">
                {c.category.replaceAll("_", " ")} · {c.status}
              </h3>
              <p className="whitespace-pre-wrap mt-3">{c.description}</p>
              {c.response && (
                <div className="bg-blue-50 p-3 rounded-lg mt-3">
                  <p className="font-medium">
                    Support response · {c.resolution.replaceAll("_", " ")}
                  </p>
                  <p className="whitespace-pre-wrap">{c.response}</p>
                </div>
              )}
            </article>
          ))}
          <LoadMore query={cases} />
        </section>
      </div>
    </Workspace>
  );
}
