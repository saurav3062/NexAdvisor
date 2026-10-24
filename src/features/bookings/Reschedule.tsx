"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, money, type Booking, type Slot } from "@/lib/nexadvisor-api";
import { dateInZone, slotTime } from "@/lib/timezones";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
interface Change {
  id: string;
  requesterId: string;
  originalStart: string;
  proposedStart: string;
  status: string;
}
export function Reschedule({ id }: { id: string }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [chosenDate, setDate] = useState("");
  const [selected, setSelected] = useState("");
  const key = useRef("");
  const base = "/bookings/" + id + "/reschedule";
  const context = useQuery({
    queryKey: ["reschedule-context", id],
    queryFn: () =>
      api<{ booking: Booking; timezone: string }>(base + "/context"),
    refetchInterval: 30000,
  });
  const changes = useQuery({
    queryKey: ["reschedule-changes", id],
    queryFn: () => api<Change[]>(base),
    refetchInterval: 15000,
  });
  const zone = context.data?.timezone || "UTC";
  const date = chosenDate || dateInZone(new Date(), zone);
  const b = context.data?.booking;
  const eligible =
    !!b &&
    b.status === "CONFIRMED" &&
    new Date(b.startsAt).getTime() >= Date.now() + 3600000;
  const pending = changes.data?.find((c) => c.status === "PENDING");
  const slots = useQuery({
    queryKey: ["reschedule-slots", id, date, b?.startsAt],
    queryFn: () => api<Slot[]>(base + "/slots?date=" + date),
    enabled: eligible && !pending,
    refetchInterval: 30000,
  });
  const save = useMutation({
    mutationFn: async (action: { change?: string; accept?: boolean }) => {
      if (action.change)
        return api(base + "/" + action.change, "POST", {
          accept: action.accept,
        });
      if (!key.current) key.current = crypto.randomUUID();
      return api(base, "POST", {
        requestKey: key.current,
        originalStart: b?.startsAt,
        proposedStart: selected,
      });
    },
    onSuccess: () => {
      key.current = "";
      setSelected("");
      cache.invalidateQueries();
    },
    onError: () => {
      cache.invalidateQueries({ queryKey: ["reschedule-slots", id] });
    },
  });
  return (
    <Workspace title="Reschedule appointment">
      <Link href="/bookings" className="text-blue-600">
        ← Your bookings
      </Link>
      <QueryState
        loading={context.isLoading || changes.isLoading}
        error={context.error || changes.error}
      />
      {b && (
        <div className={card + " my-6 space-y-3"}>
          <h2 className="text-xl font-semibold">
            {b.expertName} · {b.clientName}
          </h2>
          <p>
            Current appointment:{" "}
            <strong>{new Date(b.startsAt).toLocaleString()}</strong> (your local
            time)
          </p>
          <p>
            {money(b.amountMinor, b.currency)} ·{" "}
            {Math.round(
              (Date.parse(b.endsAt) - Date.parse(b.startsAt)) / 60000,
            )}{" "}
            minutes
          </p>
          <p className="text-sm text-slate-600">
            Both participants must agree at least one hour before the current
            appointment. Your current time stays reserved until acceptance. The
            proposed time is checked again when accepted; it is not held. Price
            and duration stay the same.
          </p>
          <p className="text-sm text-slate-600">
            After acceptance, update your calendar. The expert must add a Zoom
            or Google Meet link for the new appointment.
          </p>
        </div>
      )}
      {save.error && (
        <p role="alert" className="text-red-700 my-4">
          {save.error.message}
        </p>
      )}
      {save.isSuccess && (
        <p role="status" className="text-green-700 my-4">
          Saved. The current appointment and request status are shown below.
        </p>
      )}
      {pending ? (
        <section className={card + " space-y-4"}>
          <h2 className="text-lg font-semibold">Proposed time</h2>
          <p>
            {new Date(pending.proposedStart).toLocaleString()} (your local time)
          </p>
          <p>
            {pending.requesterId === user?.id
              ? "Waiting for the other participant to accept."
              : "The other participant has proposed a new time."}
          </p>
          <div className="flex flex-wrap gap-3">
            {pending.requesterId !== user?.id && (
              <button
                className={button}
                disabled={save.isPending || !eligible}
                onClick={() => {
                  if (
                    window.confirm(
                      "Accept this time and replace the current appointment?",
                    )
                  )
                    save.mutate({ change: pending.id, accept: true });
                }}
              >
                Accept new time
              </button>
            )}
            <button
              className="rounded-lg border px-4 py-2"
              disabled={save.isPending}
              onClick={() => save.mutate({ change: pending.id, accept: false })}
            >
              {pending.requesterId === user?.id
                ? "Withdraw proposal"
                : "Decline"}
            </button>
          </div>
          {!eligible && (
            <p>
              This proposal can no longer be accepted. Contact support if you
              need help.
            </p>
          )}
        </section>
      ) : eligible ? (
        <form
          className={card + " space-y-4"}
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({});
          }}
        >
          <h2 className="text-lg font-semibold">Choose another time</h2>
          <p className="text-sm text-slate-600">
            Dates and slots use the expert’s timezone: {zone}.
          </p>
          <label className="block">
            Date
            <input
              type="date"
              required
              className={input}
              value={date}
              min={dateInZone(new Date(), zone)}
              max={dateInZone(new Date(Date.now() + 90 * 86400000), zone)}
              onChange={(e) => {
                setDate(e.target.value);
                setSelected("");
                key.current = "";
                save.reset();
              }}
            />
          </label>
          <QueryState loading={slots.isLoading} error={slots.error} />
          <div className="flex flex-wrap gap-2">
            {slots.data
              ?.filter((s) => s.available && s.startTime !== b?.startsAt)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={selected === s.startTime}
                  className={
                    selected === s.startTime
                      ? button
                      : "border rounded-lg px-3 py-2"
                  }
                  onClick={() => {
                    setSelected(s.startTime);
                    key.current = "";
                    save.reset();
                  }}
                >
                  {slotTime(s.startTime, zone)}
                </button>
              ))}
          </div>
          {slots.data &&
            !slots.data.some(
              (s) => s.available && s.startTime !== b?.startsAt,
            ) && <p>No available times on this date. Try another day.</p>}
          {selected && (
            <p>Your local time: {new Date(selected).toLocaleString()}</p>
          )}
          <button
            className={button}
            disabled={
              !selected ||
              save.isPending ||
              !slots.data?.some((s) => s.startTime === selected && s.available)
            }
          >
            Propose new time
          </button>
        </form>
      ) : (
        b && (
          <p className="my-6">
            Rescheduling is available for confirmed appointments at least one
            hour before the start.{" "}
            <Link href={"/support?booking=" + id} className="text-blue-600">
              Contact support
            </Link>
          </p>
        )
      )}
      <section className="mt-6 space-y-3">
        <h2 className="font-semibold">Recent requests</h2>
        {changes.data
          ?.filter((c) => c.status !== "PENDING")
          .map((c) => (
            <p key={c.id}>
              {new Date(c.proposedStart).toLocaleString()} ·{" "}
              {c.status.toLowerCase()}
            </p>
          ))}
      </section>
    </Workspace>
  );
}
