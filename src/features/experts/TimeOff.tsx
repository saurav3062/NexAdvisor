"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/nexadvisor-api";
import { card, input, button, QueryState } from "@/features/shared/Workspace";
type Block = { id: string; startsAt: string; endsAt: string };
export function TimeOff() {
  const cache = useQueryClient();
  const [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const q = useQuery({
    queryKey: ["time-off"],
    queryFn: () => api<Block[]>("/me/time-off"),
  });
  const action = useMutation({
    mutationFn: ({ id }: { id?: string }) =>
      id
        ? api("/me/time-off/" + id, "DELETE")
        : api("/me/time-off", "POST", {
            startsAt: new Date(start).toISOString(),
            endsAt: new Date(end).toISOString(),
          }),
    onSuccess: () => {
      setStart("");
      setEnd("");
      cache.invalidateQueries({ queryKey: ["time-off"] });
      cache.invalidateQueries({ queryKey: ["slots"] });
    },
  });
  return (
    <section className={card}>
      <h2 className="text-xl font-semibold mb-3">Time off</h2>
      <p className="text-gray-600 mb-4">
        Block a holiday or a few hours. Enter times in your device’s local
        timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Existing
        reservations must be cancelled before blocking their time.
      </p>
      <QueryState loading={q.isLoading} error={q.error} />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          action.mutate({});
        }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <label>
            From
            <input
              type="datetime-local"
              required
              className={input}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            Until
            <input
              type="datetime-local"
              required
              className={input}
              value={end}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        <button className={button} disabled={action.isPending}>
          Block time
        </button>
      </form>
      {action.error && (
        <p role="alert" className="text-red-600 mt-3">
          {action.error.message}
        </p>
      )}
      {action.isSuccess && (
        <p role="status" className="text-green-700 mt-3">
          Time off updated.
        </p>
      )}
      <ul className="mt-5 space-y-3">
        {q.data?.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap justify-between gap-3 border-t pt-3"
          >
            <span>
              {new Date(b.startsAt).toLocaleString()} –{" "}
              {new Date(b.endsAt).toLocaleString()}
            </span>
            <button
              className="text-blue-600 min-h-11"
              disabled={action.isPending}
              onClick={() => action.mutate({ id: b.id })}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
