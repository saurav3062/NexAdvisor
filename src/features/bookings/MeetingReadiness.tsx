"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/nexadvisor-api";
import { card } from "@/features/shared/Workspace";
interface Item {
  id: string;
  startsAt: string;
  expertName: string;
  clientName: string;
  isExpert: boolean;
}
export function MeetingReadiness() {
  const q = useQuery({
    queryKey: ["meeting-readiness"],
    queryFn: () =>
      api<{ missingLinks: Item[]; rescheduleRequests: Item[] }>(
        "/me/readiness",
      ),
    refetchInterval: 30000,
  });
  if (q.error)
    return (
      <p role="alert" className="mb-6 text-amber-800">
        Meeting readiness could not be checked.{" "}
        <button className="underline" onClick={() => q.refetch()}>
          Retry
        </button>
      </p>
    );
  if (
    !q.data ||
    (!q.data.missingLinks.length && !q.data.rescheduleRequests.length)
  )
    return null;
  return (
    <section className={card + " mb-6 border-blue-200"}>
      <h2 className="font-semibold text-lg mb-3">Before your next session</h2>
      <div className="space-y-4">
        {q.data.missingLinks.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="font-medium">
                {b.isExpert ? b.clientName : b.expertName} ·{" "}
                {new Date(b.startsAt).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">
                {b.isExpert
                  ? "Add the Zoom or Google Meet link before this session starts."
                  : "Your expert has not added a meeting link yet. Message them if your session is approaching."}
              </p>
            </div>
            <Link
              className="text-blue-600 font-medium"
              href={
                b.isExpert ? "/video-call/" + b.id : "/messages?booking=" + b.id
              }
            >
              {b.isExpert ? "Add meeting link" : "Message expert"}
            </Link>
          </div>
        ))}
        {q.data.rescheduleRequests.map((b) => (
          <div key={b.id} className="flex flex-wrap justify-between gap-3">
            <p>
              Pending time change · {b.isExpert ? b.clientName : b.expertName}
            </p>
            <Link
              className="text-blue-600 font-medium"
              href={"/bookings/" + b.id + "/reschedule"}
            >
              Review proposal
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
