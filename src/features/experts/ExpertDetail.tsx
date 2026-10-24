"use client";
import { dateInZone, slotTime } from "@/lib/timezones";
import { FavoriteButton } from "./Favorites";
import { ExpertAvatar } from "./ExpertAvatar";
import { useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  money,
  type ExpertProfile,
  type Slot,
  type Review,
  type Booking,
} from "@/lib/nexadvisor-api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
export function ExpertDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const cache = useQueryClient();
  const [chosenDate, setDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [selected, setSelected] = useState("");
  const [notes, setNotes] = useState("");
  const requestKey = useRef<string | null>(null);
  const expert = useQuery({
    queryKey: ["expert", id],
    queryFn: () => api<ExpertProfile>("/experts/" + id),
  });
  const timezone = expert.data?.scheduleTimezone || "UTC";
  const date = chosenDate || dateInZone(new Date(), timezone);
  const slots = useQuery({
    queryKey: ["slots", id, date, duration],
    queryFn: () =>
      api<Slot[]>(
        "/experts/" +
          id +
          "/availability?" +
          new URLSearchParams({ date, duration: String(duration) }),
      ),
    enabled: !!date && !!expert.data,
    staleTime: 15000,
    refetchInterval: 30000,
  });
  const reviews = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => api<Review[]>("/experts/" + id + "/reviews"),
  });
  const book = useMutation({
    mutationFn: () => {
      requestKey.current ??= crypto.randomUUID();
      return api<Booking>("/bookings", "POST", {
        expertId: id,
        startsAt: selected,
        durationMinutes: duration,
        notes,
        requestKey: requestKey.current,
      });
    },
    onError: () => {
      cache.invalidateQueries({ queryKey: ["slots", id] });
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["bookings"] });
      cache.invalidateQueries({ queryKey: ["booking-counts"] });
      router.push("/bookings");
    },
  });
  function changeSelection() {
    setSelected("");
    requestKey.current = null;
    book.reset();
  }
  const e = expert.data;
  return (
    <Workspace title={e?.name || "Expert profile"}>
      {e && (
        <div className="mb-5">
          <FavoriteButton id={id} />
        </div>
      )}
      <QueryState loading={expert.isLoading} error={expert.error} />
      {e && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className={card}>
              <div className="mb-5">
                <ExpertAvatar expert={e} large />
              </div>
              <p className="text-blue-600">{e.category}</p>
              <h2 className="text-2xl font-semibold mt-2">{e.title}</h2>
              <p className="text-gray-500 mt-2">
                {e.yearsExperience} years experience · {e.location || "Remote"}
              </p>
              <p className="whitespace-pre-wrap mt-6">{e.bio}</p>
            </section>
            <section className={card}>
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>
              <QueryState loading={reviews.isLoading} error={reviews.error} />
              {reviews.data?.length === 0 && <p>No reviews yet.</p>}
              {reviews.data?.map((r) => (
                <article key={r.id} className="border-b py-3">
                  <strong>
                    {r.clientName} · {r.rating}/5
                  </strong>
                  <p>{r.comment}</p>
                </article>
              ))}
            </section>
          </div>
          <section className={card}>
            <h2 className="text-xl font-semibold">Book a consultation</h2>
            <p className="my-2">
              {money(e.hourlyRateMinor, e.currency)} / hour
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Availability dates and times use {timezone}. Booking confirmation
              requires a simulated payment.
            </p>
            <label className="block">
              Date
              <input
                type="date"
                disabled={book.isPending}
                aria-label="Session date"
                className={input}
                value={date}
                min={dateInZone(new Date(), timezone)}
                max={dateInZone(new Date(Date.now() + 89 * 86400000), timezone)}
                onChange={(event) => {
                  setDate(event.target.value);
                  changeSelection();
                }}
              />
            </label>
            <label className="block my-4">
              Duration
              <select
                disabled={book.isPending}
                className={input}
                value={duration}
                onChange={(event) => {
                  setDuration(Number(event.target.value));
                  changeSelection();
                }}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
            <QueryState loading={slots.isLoading} error={slots.error} />
            <div className="grid grid-cols-3 gap-2">
              {slots.data?.map((s) => (
                <button
                  key={s.id}
                  aria-pressed={selected === s.startTime}
                  disabled={!s.available || book.isPending}
                  onClick={() => {
                    setSelected(s.startTime);
                    requestKey.current = null;
                    book.reset();
                  }}
                  className={
                    "app-control border rounded p-2 text-sm disabled:opacity-30 " +
                    (selected === s.startTime
                      ? "bg-blue-600 text-white"
                      : "bg-white")
                  }
                >
                  {slotTime(s.startTime, timezone)}
                </button>
              ))}
            </div>
            {slots.data?.length === 0 && (
              <p className="text-gray-500">No availability for this date.</p>
            )}
            <label className="block mt-4">
              Session notes
              <textarea
                disabled={book.isPending}
                className={input}
                maxLength={2000}
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  requestKey.current = null;
                }}
              />
            </label>
            {selected && (
              <p className="mt-3 text-sm text-blue-700">
                Your local time: {new Date(selected).toLocaleString()} (
                {Intl.DateTimeFormat().resolvedOptions().timeZone})
              </p>
            )}
            {selected && (
              <p className="mt-3 font-semibold">
                Total:{" "}
                {money(
                  slots.data?.find((s) => s.startTime === selected)
                    ?.amountMinor || 0,
                  e.currency,
                )}
              </p>
            )}
            {book.error && (
              <p role="alert" className="text-red-600 mt-3">
                {book.error.message}
              </p>
            )}
            {!user ? (
              <Link
                className={button + " mt-4"}
                href={"/login?next=" + encodeURIComponent("/experts/" + id)}
              >
                Sign in to book
              </Link>
            ) : user.role !== "client" ? (
              <p className="mt-4">Use a client account to book sessions.</p>
            ) : !user.emailVerified ? (
              <Link href="/profile" className="text-blue-600 block mt-4">
                Verify your email using the banner above before booking.
              </Link>
            ) : (
              <button
                disabled={
                  !selected ||
                  book.isPending ||
                  !slots.data?.some(
                    (s) => s.startTime === selected && s.available,
                  )
                }
                className={button + " mt-4 w-full"}
                onClick={() => book.mutate()}
              >
                {book.isPending ? "Reserving..." : "Reserve session"}
              </button>
            )}
          </section>
        </div>
      )}
    </Workspace>
  );
}
