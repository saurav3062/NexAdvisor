"use client";
import { useState } from "react";
import { ExpertAvatar } from "@/features/experts/ExpertAvatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, money, type ExpertProfile } from "@/lib/nexadvisor-api";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
export function ExpertApproval() {
  const q = useQuery({
    queryKey: ["pending-experts"],
    queryFn: () => api<ExpertProfile[]>("/admin/experts"),
  });
  return (
    <Workspace title="Expert applications">
      <QueryState loading={q.isLoading} error={q.error} />
      {q.data?.length === 0 && <p>No pending applications.</p>}
      <div className="space-y-5">
        {q.data?.map((e) => (
          <Application key={e.id} expert={e} />
        ))}
      </div>
    </Workspace>
  );
}
function Application({ expert: e }: { expert: ExpertProfile }) {
  const [note, setNote] = useState("");
  const cache = useQueryClient();
  const review = useMutation({
    mutationFn: (decision: string) =>
      api("/admin/experts/" + e.id + "/review", "POST", { decision, note }),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["pending-experts"] });
      cache.invalidateQueries({ queryKey: ["experts"] });
      cache.invalidateQueries({ queryKey: ["featured-experts"] });
      cache.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  return (
    <article className={card}>
      <div className="mb-4">
        <ExpertAvatar expert={e} large />
      </div>
      <h2 className="text-xl font-semibold">
        {e.name} · {e.title}
      </h2>
      <p>
        {e.category} · {e.yearsExperience} years · {money(e.hourlyRateMinor)} /
        hour
      </p>
      <p className="my-4 whitespace-pre-wrap">{e.bio}</p>
      <label className="block">
        Review note
        <textarea
          required
          maxLength={1000}
          className={input}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className="flex gap-3 mt-3">
        <button
          className={button}
          disabled={!note.trim() || review.isPending}
          onClick={() => review.mutate("APPROVED")}
        >
          Approve
        </button>
        <button
          className="border rounded px-4 py-2"
          disabled={!note.trim() || review.isPending}
          onClick={() => review.mutate("REJECTED")}
        >
          Reject
        </button>
      </div>
      {review.error && <p className="text-red-600">{review.error.message}</p>}
    </article>
  );
}
