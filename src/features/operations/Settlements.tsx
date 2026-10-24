"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, money } from "@/lib/nexadvisor-api";

import { usePaged, LoadMore } from "@/features/shared/Pagination";

import {
  Workspace,
  QueryState,
  card,
  button,
} from "@/features/shared/Workspace";

export interface Settlement {
  bookingId: string;
  grossMinor: number;
  commissionBps: number;
  commissionMinor: number;
  netMinor: number;
  currency: string;
  payoutStatus: string;
  expertName: string;
  bookingStatus: string;
  endsAt: string;
  openIssues: number;
}

export function Settlements({ admin = false }: { admin?: boolean }) {
  const cache = useQueryClient();
  const q = usePaged<Settlement>(
    ["settlements", String(admin)],
    admin ? "/admin/settlements" : "/me/settlements",
  );
  const pay = useMutation({
    mutationFn: (id: string) =>
      api("/admin/settlements/" + id + "/simulate-payout", "POST"),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["settlements"] });
      cache.invalidateQueries({ queryKey: ["reconciliation"] });
    },
  });
  return (
    <Workspace title={admin ? "Expert settlements" : "Your earnings"}>
      <p className="mb-6 text-slate-600">
        New payments reserve 25% for NexAdvisor and 75% for the expert. Earlier
        transactions retain their recorded commission. Payouts require a
        completed appointment, a 48-hour review period, and no open issues. All
        amounts are simulated.
      </p>
      <QueryState loading={q.isLoading} error={q.error} />
      {pay.error && (
        <p role="alert" className="text-red-600">
          {pay.error.message}
        </p>
      )}
      <div className="space-y-4">
        {q.data?.map((s) => (
          <article key={s.bookingId} className={card}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">{s.expertName}</h2>
                <p className="text-xs text-slate-500">
                  Booking {s.bookingId.slice(0, 8)} · {s.bookingStatus}
                </p>
              </div>
              <strong>{s.payoutStatus.replaceAll("_", " ")}</strong>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              {[
                ["Client payment", s.grossMinor],
                [`Commission (${s.commissionBps / 100}%)`, s.commissionMinor],
                ["Expert share", s.netMinor],
              ].map(([label, n]) => (
                <div key={label}>
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="text-lg font-semibold">
                    {money(Number(n), s.currency)}
                  </dd>
                </div>
              ))}
            </dl>
            {s.openIssues > 0 && (
              <p className="text-amber-700">
                Payout paused: {s.openIssues} open support case(s).
              </p>
            )}
            {admin && s.payoutStatus === "HELD" && (
              <button
                className={button}
                disabled={
                  pay.isPending ||
                  s.bookingStatus !== "COMPLETED" ||
                  s.openIssues > 0 ||
                  Date.now() < new Date(s.endsAt).getTime() + 172800000
                }
                onClick={() => pay.mutate(s.bookingId)}
              >
                Simulate expert payout
              </button>
            )}
          </article>
        ))}
      </div>
      {q.data?.length === 0 && <p>No payment records yet.</p>}
      <LoadMore query={q} />
    </Workspace>
  );
}
