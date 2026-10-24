"use client";
import { usePaged, LoadMore } from "@/features/shared/Pagination";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Message } from "@/lib/nexadvisor-api";
import { useBookings } from "@/features/bookings/Bookings";
import { useAuth } from "@/contexts/AuthContext";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
export function Conversations({ reviews = false }: { reviews?: boolean }) {
  const params = useSearchParams();
  const [selected, setSelected] = useState(params.get("booking") || "");
  const bookings = useBookings();
  const { user } = useAuth();
  const options = bookings.data?.filter(
    (b) => !reviews || (b.status === "COMPLETED" && b.clientId === user?.id),
  );
  return (
    <Workspace title={reviews ? "Review a consultation" : "Booking messages"}>
      <QueryState loading={bookings.isLoading} error={bookings.error} />
      <label className="block mb-5">
        Choose a booking
        <select
          value={selected}
          className={input}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Select a booking</option>
          {selected && !options?.some((b) => b.id === selected) && (
            <option value={selected}>
              Selected booking · {selected.slice(0, 8)}
            </option>
          )}
          {options?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.expertName} / {b.clientName} ·{" "}
              {new Date(b.startsAt).toLocaleString()}
            </option>
          ))}
        </select>
      </label>
      <LoadMore query={bookings} />
      {selected &&
        (reviews ? (
          <ReviewForm key={selected} id={selected} />
        ) : (
          <Messages key={selected} id={selected} />
        ))}
    </Workspace>
  );
}
function Messages({ id }: { id: string }) {
  const cache = useQueryClient();
  const [content, setContent] = useState("");
  const requestKey = useRef<string | null>(null);
  const q = usePaged<Message>(
    ["messages", id],
    "/bookings/" + id + "/messages",
    10000,
  );
  const send = useMutation({
    mutationFn: () => {
      requestKey.current ??= crypto.randomUUID();
      return api("/bookings/" + id + "/messages", "POST", {
        content,
        requestKey: requestKey.current,
      });
    },
    onSuccess: () => {
      setContent("");
      requestKey.current = null;
      cache.invalidateQueries({ queryKey: ["messages", id] });
    },
  });
  return (
    <div className={card}>
      <QueryState loading={q.isLoading} error={q.error} />
      <div className="message-history space-y-4 mb-6">
        {q.data?.length === 0 && (
          <p className="text-gray-500">
            No messages yet. Share what you’d like to discuss with your expert.
          </p>
        )}
        {q.data?.map((m) => (
          <article key={m.id} className="border-b pb-3">
            <strong>{m.senderName}</strong>
            <p className="whitespace-pre-wrap">{m.content}</p>
            <small className="text-gray-500">
              {new Date(m.createdAt).toLocaleString()}
            </small>
          </article>
        ))}
      </div>
      <LoadMore query={q} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate();
        }}
      >
        <textarea
          required
          aria-label="Message"
          maxLength={2000}
          disabled={send.isPending}
          className={input}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            requestKey.current = null;
          }}
        />
        <button
          disabled={send.isPending || !content.trim()}
          className={button + " mt-3"}
        >
          Send message
        </button>
        {send.error && (
          <p role="alert" className="text-red-600">
            {send.error.message}
          </p>
        )}
      </form>
      <p className="text-xs text-gray-500 mt-4">
        Messages refresh every 10 seconds. Use Load more to read the rest of the
        conversation.
      </p>
    </div>
  );
}
function ReviewForm({ id }: { id: string }) {
  const [rating, setRating] = useState(5),
    [comment, setComment] = useState("");
  const send = useMutation({
    mutationFn: () =>
      api("/bookings/" + id + "/review", "POST", { rating, comment }),
  });
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        send.mutate();
      }}
    >
      <label>
        Rating
        <select
          className={input}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} / 5
            </option>
          ))}
        </select>
      </label>
      <label className="block mt-4">
        Your review
        <textarea
          required
          maxLength={2000}
          className={input}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <button
        disabled={send.isPending || send.isSuccess}
        className={button + " mt-4"}
      >
        Submit review
      </button>
      {send.isSuccess && (
        <p className="text-green-700 mt-3">Review submitted.</p>
      )}
      {send.error && (
        <p role="alert" className="text-red-600">
          {send.error.message}
        </p>
      )}
    </form>
  );
}
