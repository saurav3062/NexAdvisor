"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api, type Booking } from "@/lib/nexadvisor-api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
type Meeting = { url: string };
export function VideoSession() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => api<Booking>("/bookings/" + bookingId),
    refetchInterval: 15000,
  });
  const meeting = useQuery({
    queryKey: ["meeting", bookingId],
    queryFn: () => api<Meeting>("/bookings/" + bookingId + "/meeting"),
    enabled: !!q.data,
    refetchInterval: 15000,
  });
  const b = q.data;
  const active = b?.status === "CONFIRMED" && new Date(b.endsAt) > new Date();
  return (
    <Workspace title="Consultation session">
      <QueryState loading={q.isLoading} error={q.error} />
      {b && (
        <div className={card + " space-y-5"}>
          <h2 className="text-xl font-semibold">
            {b.expertName} · {b.clientName}
          </h2>
          <p>
            {new Date(b.startsAt).toLocaleString()} (your local time) ·{" "}
            {b.status}
          </p>
          <QueryState loading={meeting.isLoading} error={meeting.error} />
          {!active ? (
            <p>
              Meeting access is available for confirmed bookings until the
              scheduled end time.
            </p>
          ) : (
            <>
              {meeting.data?.url ? (
                <div>
                  <p className="mb-3">
                    Your expert has supplied this external meeting link. Check
                    the destination before opening it.
                  </p>
                  <p className="break-all text-sm text-gray-500 mb-3">
                    {meeting.data.url}
                  </p>
                  <a
                    className={button}
                    href={meeting.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                  >
                    Open meeting
                  </a>
                </div>
              ) : (
                !meeting.isLoading &&
                !meeting.error && (
                  <p>
                    The expert has not added a meeting link yet. Use booking
                    messages to coordinate.
                  </p>
                )
              )}
              {b.expertAccountId === user?.id &&
                new Date(b.endsAt) > new Date() &&
                meeting.data && (
                  <MeetingEditor
                    key={meeting.data.url}
                    id={bookingId}
                    initial={meeting.data.url}
                  />
                )}
            </>
          )}
          <p className="text-sm text-gray-500">
            Meetings take place with your expert on Google Meet, Zoom or
            Microsoft Teams. NexAdvisor does not create or host the call.
          </p>
          <Link
            className="text-blue-600"
            href={"/messages?booking=" + bookingId}
          >
            Open booking messages
          </Link>
        </div>
      )}
    </Workspace>
  );
}
function MeetingEditor({ id, initial }: { id: string; initial: string }) {
  const [url, setUrl] = useState(initial);
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      api<Meeting>("/bookings/" + id + "/meeting", "PUT", { url }),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["meeting", id] }),
  });
  return (
    <form
      className="border-t pt-5 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <label className="block">
        Meeting link
        <input
          className={input}
          type="url"
          required
          maxLength={2048}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://meet.google.com/…"
        />
      </label>
      <p className="text-sm text-gray-500">
        Create a meeting with your provider, then paste its HTTPS link here.
        Both participants can see it in session details. Email updates are
        simulated; ask your client to check their booking before the session.
      </p>
      <button className={button} disabled={save.isPending || url === initial}>
        {save.isPending ? "Saving…" : "Save meeting link"}
      </button>
      {save.error && (
        <p role="alert" className="text-red-600">
          {save.error.message}
        </p>
      )}
      {save.isSuccess && <p role="status">Meeting link saved.</p>}
    </form>
  );
}
