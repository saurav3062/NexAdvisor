"use client";
import { MeetingReadiness } from "@/features/bookings/MeetingReadiness";
import Link from "next/link";
import { usePaged, LoadMore } from "@/features/shared/Pagination";
import { downloadCalendar } from "@/lib/calendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, money, type Booking, type Config } from "@/lib/nexadvisor-api";
import {
  Workspace,
  QueryState,
  card,
  button,
  AccountLinks,
} from "@/features/shared/Workspace";
export function useBookings() {
  return usePaged<Booking>(["bookings"], "/me/bookings", 30000);
}
export function Bookings() {
  const q = useBookings();
  const { user } = useAuth();
  const cache = useQueryClient();
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => api<Config>("/config"),
  });
  const action = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api("/bookings/" + id + "/" + action, "POST"),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["bookings"] });
      cache.invalidateQueries({ queryKey: ["payments"] });
      cache.invalidateQueries({ queryKey: ["booking-counts"] });
    },
  });
  return (
    <Workspace title="Your bookings">
      <AccountLinks />
      <MeetingReadiness />
      <QueryState loading={q.isLoading} error={q.error} />
      {action.error && (
        <p role="alert" className="text-red-600 mb-4">
          {action.error.message}
        </p>
      )}
      {q.data?.length === 0 && (
        <div className={card}>
          No bookings yet.{" "}
          <Link href="/experts" className="text-blue-600">
            Find an expert
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {q.data?.map((b) => (
          <article key={b.id} className={card}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">
                  {user?.role === "expert" ? b.clientName : b.expertName}
                </h2>
                <p>
                  {new Date(b.startsAt).toLocaleString()} –{" "}
                  {new Date(b.endsAt).toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-500">
                  Times shown in your local timezone
                </p>
              </div>
              <div>
                <p className="font-semibold">
                  {money(b.amountMinor, b.currency)}
                </p>
                <p>{b.status}</p>
                <p className="text-xs text-amber-800">
                  {b.paymentStatus.replaceAll("_", " ")}
                </p>
              </div>
            </div>
            {b.notes && <p className="mt-3 whitespace-pre-wrap">{b.notes}</p>}
            {b.status === "PENDING" && b.expiresAt && (
              <p className="mt-3 text-sm text-amber-800">
                Unpaid reservation expires at{" "}
                {new Date(b.expiresAt).toLocaleTimeString()}. Confirm with a
                simulated payment before then.
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-4">
              {b.status === "CONFIRMED" &&
                new Date(b.startsAt) > new Date() && (
                  <Link
                    className="text-blue-600 py-2"
                    href={"/bookings/" + b.id + "/reschedule"}
                  >
                    Reschedule
                  </Link>
                )}
              {b.status === "PENDING" && b.clientId === user?.id && (
                <button
                  className={button}
                  disabled={
                    action.isPending ||
                    !config.data?.simulationEnabled ||
                    new Date(b.startsAt) <= new Date() ||
                    !b.expiresAt ||
                    new Date(b.expiresAt) <= new Date()
                  }
                  onClick={() =>
                    action.mutate({ id: b.id, action: "simulate-payment" })
                  }
                >
                  Simulate payment & confirm
                </button>
              )}
              {["PENDING", "CONFIRMED"].includes(b.status) &&
                new Date(b.startsAt) > new Date() && (
                  <button
                    className="border rounded-lg px-4 py-2"
                    disabled={action.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Cancel this appointment? Clients receive a full simulated refund at least one hour before the start. For later cancellations, use Support. Expert cancellations receive a full simulated refund.",
                        )
                      ) {
                        action.mutate({ id: b.id, action: "cancel" });
                      }
                    }}
                  >
                    Cancel
                    {b.paymentStatus === "SIMULATED_PAID"
                      ? " & simulate refund"
                      : ""}
                  </button>
                )}
              {b.status === "CONFIRMED" &&
                b.expertAccountId === user?.id &&
                new Date(b.endsAt) <= new Date() && (
                  <button
                    className={button}
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate({ id: b.id, action: "complete" })
                    }
                  >
                    Mark completed
                  </button>
                )}
              <Link
                className="text-blue-600 py-2"
                href={"/support?booking=" + b.id}
              >
                Get help / request late cancellation
              </Link>
              <Link
                className="text-blue-600 py-2"
                href={"/messages?booking=" + b.id}
              >
                Messages
              </Link>
              {b.status === "CONFIRMED" && (
                <button
                  className="text-blue-600 py-2"
                  onClick={() => downloadCalendar(b)}
                >
                  Add to calendar
                </button>
              )}
              {b.status === "CONFIRMED" && (
                <Link
                  className="text-blue-600 py-2"
                  href={"/video-call/" + b.id}
                >
                  {b.expertAccountId === user?.id
                    ? "Manage meeting"
                    : "Session details"}
                </Link>
              )}
              {b.status === "COMPLETED" && b.clientId === user?.id && (
                <Link
                  className="text-blue-600 py-2"
                  href={"/reviews?booking=" + b.id}
                >
                  Write review
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      <LoadMore query={q} />
    </Workspace>
  );
}
export { Dashboard } from "@/features/account/Dashboard";
