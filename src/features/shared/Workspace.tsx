"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, type Config } from "@/lib/nexadvisor-api";
export const button =
  "app-button inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-blue-700";
export const input =
  "app-control w-full rounded-lg border border-gray-300 bg-white px-3 py-2";
export const card = "app-card rounded-xl border bg-white p-6 shadow-sm";
export function Workspace({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-workspace max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <SimulationNotice />
      {children}
    </div>
  );
}
export function SimulationNotice() {
  const { data, isError } = useQuery({
    queryKey: ["config"],
    queryFn: () => api<Config>("/config"),
  });
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-3 mb-6 text-sm">
      {!data
        ? isError
          ? "Payment availability could not be loaded. Please try again shortly."
          : "Checking payment availability…"
        : data.simulationEnabled
          ? "Demo payments are simulated. No money is charged, refunded or paid out."
          : "Payments are unavailable. No real payment provider is connected."}
    </div>
  );
}
export function QueryState({
  loading,
  error,
}: {
  loading: boolean;
  error: Error | null;
}) {
  return loading ? (
    <div role="status" aria-label="Loading content" className="py-6 space-y-3">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="skeleton h-5 w-1/3" />
      <div aria-hidden="true" className="skeleton h-20 w-full" />
    </div>
  ) : error ? (
    <p role="alert" className="bg-red-50 text-red-700 p-4 rounded-lg">
      {error.message}{" "}
      <button onClick={() => window.location.reload()} className="underline">
        Retry
      </button>
    </p>
  ) : null;
}
export function AccountLinks() {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {[
        ["/bookings", "Bookings"],
        ["/messages", "Messages"],
        ["/payments", "Payment history"],
        ["/profile", "Profile"],
        ["/favorites", "Saved experts"],
        ["/support", "Support"],
      ].map(([url, label]) => (
        <Link className="text-blue-600" href={url} key={url}>
          {label}
        </Link>
      ))}
    </div>
  );
}
