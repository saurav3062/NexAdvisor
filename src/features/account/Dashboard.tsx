"use client";
import { MeetingReadiness } from "@/features/bookings/MeetingReadiness";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Booking } from "@/lib/nexadvisor-api";
import {
  Workspace,
  QueryState,
  card,
  button,
} from "@/features/shared/Workspace";
import { SetupChecklist } from "./SetupChecklist";

export function Dashboard() {
  const { user } = useAuth();
  const isExpert = user?.role === "expert";
  const counts = useQuery({
    queryKey: ["booking-counts"],
    queryFn: () =>
      api<{ status: string; total: number }[]>("/me/booking-counts"),
    refetchInterval: 30000,
  });
  const upcoming = useQuery({
    queryKey: ["upcoming-bookings"],
    queryFn: () => api<Booking[]>("/me/upcoming-bookings"),
    refetchInterval: 30000,
  });
  return (
    <Workspace title={"Welcome back, " + (user?.name.split(" ")[0] || "there")}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-slate-600">
          {isExpert
            ? "Your consultations, profile and availability, all in one place."
            : "A little clarity goes a long way. Find the right expert for your next step."}
        </p>
        <Link
          className={button + " gap-2"}
          href={isExpert ? "/expert-onboarding" : "/experts"}
        >
          {isExpert ? "Manage my profile" : "Find an expert"}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <SetupChecklist />
      <MeetingReadiness />
      <QueryState loading={counts.isLoading} error={counts.error} />
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        {[
          { status: "PENDING", label: "Awaiting confirmation", icon: Clock3 },
          {
            status: "CONFIRMED",
            label: "Confirmed sessions",
            icon: CalendarDays,
          },
          {
            status: "COMPLETED",
            label: "Completed sessions",
            icon: CheckCircle2,
          },
        ].map((item) => (
          <Link
            href="/bookings"
            key={item.status}
            className={card + " flex items-center gap-4 hover:border-blue-200"}
          >
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <item.icon size={22} />
            </span>
            <div>
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {counts.data
                  ? counts.data.find((c) => c.status === item.status)?.total ||
                    0
                  : "—"}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className={card + " lg:col-span-2"}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Coming up next</h2>
            <Link
              className="text-sm font-medium text-blue-600"
              href="/bookings"
            >
              All bookings →
            </Link>
          </div>
          <QueryState loading={upcoming.isLoading} error={upcoming.error} />
          {upcoming.data?.length === 0 && (
            <div className="rounded-xl bg-slate-50 px-5 py-9 text-center">
              <CalendarDays className="mx-auto mb-3 text-slate-400" size={28} />
              <h3 className="font-semibold">
                Your next conversation starts here
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {isExpert
                  ? "Once your profile is approved and your hours are set, new reservations will appear here."
                  : "No upcoming sessions yet. Explore experts and choose a time that works for you."}
              </p>
              <Link
                href={isExpert ? "/expert-onboarding" : "/experts"}
                className="mt-4 inline-block text-sm font-semibold text-blue-600"
              >
                {isExpert ? "Check my availability" : "Explore experts"} →
              </Link>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {upcoming.data?.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-semibold">
                    {isExpert ? b.clientName : b.expertName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(b.startsAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    {b.status === "PENDING"
                      ? "Awaiting simulated payment"
                      : "Confirmed"}
                  </span>
                </div>
                <Link
                  href={
                    b.status === "PENDING" ? "/bookings" : "/video-call/" + b.id
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-blue-600"
                >
                  {b.status === "PENDING"
                    ? "View reservation"
                    : "Session details"}
                </Link>
              </div>
            ))}
          </div>
          {!!upcoming.data?.length && (
            <p className="mt-4 text-xs text-slate-400">
              Your next five active reservations · times shown in your local
              timezone
            </p>
          )}
        </section>
        <aside className="space-y-4">
          <Link
            href="/messages"
            className={card + " block hover:border-blue-200"}
          >
            <MessageSquare className="mb-4 text-blue-600" size={24} />
            <h2 className="font-semibold">Keep the conversation going</h2>
            <p className="my-2 text-sm leading-6 text-slate-500">
              Share context and coordinate meeting details in your booking
              messages.
            </p>
            <span className="text-sm font-semibold text-blue-600">
              Open messages →
            </span>
          </Link>
          <div className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold">Your workspace</h2>
            <div className="mt-2 space-y-1">
              {[
                ["/profile", "Personal profile"],
                ["/support", "Booking support"],
                ["/privacy-requests", "Privacy & account closure"],
                ...(isExpert ? [["/earnings", "Your earnings"]] : []),
                ["/favorites", "Saved experts"],
                ["/payments", "Payment history"],
                ...(user?.role === "admin"
                  ? [["/admin", "Review applications"]]
                  : []),
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between py-2 text-sm text-slate-600 hover:text-blue-600"
                >
                  {label}
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Workspace>
  );
}
