"use client";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, type ExpertProfile, type Hours } from "@/lib/nexadvisor-api";

export function SetupChecklist() {
  const { user } = useAuth();
  const expert = useQuery({
    queryKey: ["my-expert"],
    queryFn: () => api<ExpertProfile | null>("/me/expert"),
    enabled: user?.role === "expert",
  });
  const hours = useQuery({
    queryKey: ["my-hours"],
    queryFn: () => api<Hours[]>("/me/availability"),
    enabled: user?.role === "expert",
  });
  if (!user || user.role === "admin") return null;
  if (user.role === "expert" && (expert.isLoading || hours.isLoading))
    return (
      <p className="mb-6 text-sm text-slate-500" role="status">
        Loading your setup progress…
      </p>
    );
  if (user.role === "expert" && (expert.error || hours.error))
    return (
      <p role="alert" className="mb-6 text-sm text-red-700">
        Setup progress couldn’t load. Refresh to try again.
      </p>
    );
  const steps =
    user.role === "expert"
      ? [
          {
            title: "Verify your email",
            detail: "Use your private pilot verification link.",
            done: user.emailVerified,
            href: "/profile",
          },
          {
            title: "Introduce your expertise",
            detail: "Your title, background and consultation rate.",
            done: !!expert.data,
            href: "/expert-onboarding",
          },
          {
            title: "Add your portrait",
            detail: "Help clients put a face to your name.",
            done: !!expert.data?.photoVersion,
            href: expert.data
              ? "/expert-onboarding#profile-photo"
              : "/expert-onboarding#professional-profile",
          },
          {
            title: "Set available hours",
            detail: "Choose weekly hours and your schedule timezone.",
            done: !!hours.data?.length,
            href: expert.data
              ? "/expert-onboarding#weekly-availability"
              : "/expert-onboarding#professional-profile",
          },
          {
            title: "Profile approval",
            detail:
              expert.data?.status === "REJECTED"
                ? "Review the feedback and resubmit your profile."
                : "An administrator reviews your profile before it goes live.",
            done: expert.data?.status === "APPROVED",
            href: "/expert-onboarding",
          },
        ]
      : [
          {
            title: "Verify your email",
            detail: "Required before your first reservation.",
            done: user.emailVerified,
            href: "/profile",
          },
          {
            title: "Introduce yourself",
            detail: "Personalize your profile with a short introduction.",
            done: !!user.bio?.trim(),
            href: "/profile",
          },
        ];
  const completed = steps.filter((s) => s.done).length;
  return (
    <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Getting started
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {user.role === "expert"
              ? "Your path to the first consultation"
              : "Make yourself at home"}
          </h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {completed} of {steps.length} complete
        </span>
      </div>
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Account setup"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={completed}
      >
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.title}
            href={step.href}
            className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
          >
            {step.done ? (
              <CheckCircle2
                className="mt-0.5 shrink-0 text-blue-600"
                size={19}
              />
            ) : (
              <Circle className="mt-0.5 shrink-0 text-slate-300" size={19} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">
                {step.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {step.detail}
              </p>
            </div>
            <ArrowUpRight size={15} className="mt-1 shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>
    </section>
  );
}
