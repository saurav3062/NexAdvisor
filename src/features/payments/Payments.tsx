"use client";
import { usePaged, LoadMore } from "@/features/shared/Pagination";
import { money, type Payment } from "@/lib/nexadvisor-api";
import { Workspace, QueryState, card } from "@/features/shared/Workspace";
export function Payments() {
  const q = usePaged<Payment>(["payments"], "/me/payments");
  return (
    <Workspace title="Simulated payment history">
      <QueryState loading={q.isLoading} error={q.error} />
      <div className="space-y-4">
        {q.data?.map((p) => (
          <article
            className={card + " flex flex-wrap justify-between gap-3"}
            key={p.id}
          >
            <div>
              <strong>{p.expertName}</strong>
              <p className="text-gray-500">
                {new Date(p.createdAt).toLocaleString()}
              </p>
              <p className="text-xs">Reference: {p.id}</p>
            </div>
            <div>
              <strong>{money(p.amountMinor, p.currency)}</strong>
              <p className="text-amber-800">{p.status.replaceAll("_", " ")}</p>
              <p className="text-sm">No real funds moved</p>
            </div>
          </article>
        ))}
      </div>
      <LoadMore query={q} />
      {q.data?.length === 0 && <p>No simulated payments yet.</p>}
    </Workspace>
  );
}
