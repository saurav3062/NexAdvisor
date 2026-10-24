"use client";
import { TimeOff } from "./TimeOff";
import { PhotoEditor } from "./PhotoEditor";
import { SetupChecklist } from "@/features/account/SetupChecklist";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type ExpertProfile,
  type Category,
  type Hours,
} from "@/lib/nexadvisor-api";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
export function ExpertEditor() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-expert"],
    queryFn: () => api<ExpertProfile | null>("/me/expert"),
  });
  return (
    <Workspace title="Expert profile & availability">
      <QueryState loading={q.isLoading} error={q.error} />
      <p className="mb-6 text-slate-600">
        Build your profile, add a portrait, then choose when clients can book
        you.
      </p>
      <SetupChecklist />
      {!user?.emailVerified && (
        <p className={card + " mb-6"}>
          Verify your email using the banner above before submitting your expert
          profile. During the pilot, ask the operator for your private
          verification link.
        </p>
      )}
      {!q.isLoading && !q.error && (
        <Editor key={q.data?.id || "new"} expert={q.data ?? undefined} />
      )}
      {q.data && (
        <div className="mt-6">
          <TimeOff />
        </div>
      )}
    </Workspace>
  );
}
function Editor({ expert }: { expert?: ExpertProfile }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [title, setTitle] = useState(expert?.title || "");
  const [bio, setBio] = useState(expert?.bio || "");
  const [categoryId, setCategory] = useState(
    expert?.categoryId || "technology",
  );
  const [rate, setRate] = useState((expert?.hourlyRateMinor || 10000) / 100);
  const [years, setYears] = useState(expert?.yearsExperience || 0);
  const [saved, setSaved] = useState(!!expert);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  const save = useMutation({
    mutationFn: () =>
      api<ExpertProfile>("/me/expert", "PUT", {
        title,
        bio,
        categoryId,
        hourlyRateMinor: Math.round(rate * 100),
        yearsExperience: years,
      }),
    onSuccess: () => {
      setSaved(true);
      cache.invalidateQueries({ queryKey: ["my-expert"] });
      cache.invalidateQueries({ queryKey: ["experts"] });
      cache.invalidateQueries({ queryKey: ["featured-experts"] });
      cache.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  return (
    <div className="space-y-6">
      <form
        id="professional-profile"
        className={card + " space-y-4 scroll-mt-28"}
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="text-xl font-semibold">Your professional profile</h2>
        <p>
          Status: <strong>{expert?.status || "Not submitted"}</strong>
        </p>
        {expert?.reviewNote && <p>Review note: {expert.reviewNote}</p>}
        <p className="text-gray-600">
          Profile changes require administrator approval before appearing
          publicly.
        </p>
        <label className="block">
          Professional title
          <input
            required
            maxLength={120}
            className={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block">
          Category
          <select
            className={input}
            value={categoryId}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          About your expertise
          <textarea
            required
            minLength={30}
            maxLength={3000}
            rows={4}
            className={input}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label>
            Hourly rate ({expert?.currency || "INR"})
            <input
              type="number"
              required
              min={1}
              max={10000}
              step="0.01"
              className={input}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>
          <label>
            Years of experience
            <input
              required
              type="number"
              min={0}
              max={80}
              className={input}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
          </label>
        </div>
        <button
          className={button}
          disabled={
            save.isPending || !user?.emailVerified || !categories.data?.length
          }
        >
          {save.isPending ? "Submitting…" : "Save & submit for approval"}
        </button>
        {save.isSuccess && (
          <p className="text-green-700">Submitted for review.</p>
        )}
        {save.error && (
          <p role="alert" className="text-red-600">
            {save.error.message}
          </p>
        )}
      </form>
      {expert ? (
        <PhotoEditor expert={expert} />
      ) : (
        <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
          Next: save your profile to add a photo and set your weekly
          availability.
        </p>
      )}
      {saved && <Schedule timezone={expert?.scheduleTimezone || "UTC"} />}
    </div>
  );
}
function Schedule({ timezone }: { timezone: string }) {
  const q = useQuery({
    queryKey: ["my-hours"],
    queryFn: () => api<Hours[]>("/me/availability"),
  });
  return (
    <section id="weekly-availability" className={card + " scroll-mt-28"}>
      <h2 className="text-xl font-semibold mb-2">Weekly availability</h2>
      <p className="text-gray-500 mb-4">
        Choose recurring hours in your timezone on half-hour boundaries.
        Daylight-saving gaps and sessions spanning a clock change are skipped.
        Repeated times show their UTC offset. Existing bookings remain reserved
        when hours change.
      </p>
      <QueryState loading={q.isLoading} error={q.error} />
      {q.data && (
        <ScheduleForm
          key={JSON.stringify(q.data) + timezone}
          initial={q.data}
          initialZone={timezone}
        />
      )}
    </section>
  );
}
function ScheduleForm({
  initial,
  initialZone,
}: {
  initial: Hours[];
  initialZone: string;
}) {
  const [timezone, setTimezone] = useState(initialZone);
  const cache = useQueryClient();
  const [days, setDays] = useState(initial);
  const save = useMutation({
    mutationFn: () => api("/me/availability", "PUT", { days, timezone }),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["my-hours"] });
      cache.invalidateQueries({ queryKey: ["my-expert"] });
      cache.invalidateQueries({ queryKey: ["slots"] });
    },
  });
  const time = (n: number) =>
    String(Math.floor(n / 60)).padStart(2, "0") +
    ":" +
    String(n % 60).padStart(2, "0");
  const minute = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-3"
    >
      <label className="block">
        Schedule timezone
        <select
          className={input}
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {Array.from(
            new Set([
              "UTC",
              "Asia/Kolkata",
              initialZone,
              ...Intl.supportedValuesOf("timeZone"),
            ]),
          ).map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </select>
      </label>
      <p className="text-sm text-slate-500">
        Changing timezone keeps the entered clock hours and affects future
        availability only. Existing appointments keep their exact time. An end
        time of 00:00 means midnight at the end of that day.
      </p>
      {[
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ].map((name, i) => {
        const day = days.find((d) => d.dayOfWeek === i + 1);
        return (
          <div key={name} className="schedule-row">
            <label className="w-36">
              <input
                type="checkbox"
                checked={!!day}
                onChange={(e) =>
                  setDays(
                    e.target.checked
                      ? [
                          ...days,
                          {
                            dayOfWeek: i + 1,
                            startMinute: 540,
                            endMinute: 1020,
                          },
                        ]
                      : days.filter((d) => d.dayOfWeek !== i + 1),
                  )
                }
              />{" "}
              {name}
            </label>
            {day && (
              <>
                <input
                  aria-label={name + " start"}
                  required
                  type="time"
                  step={1800}
                  value={time(day.startMinute)}
                  onChange={(e) =>
                    setDays(
                      days.map((d) =>
                        d === day
                          ? { ...d, startMinute: minute(e.target.value) }
                          : d,
                      ),
                    )
                  }
                />
                <span>to</span>
                <input
                  aria-label={name + " end"}
                  required
                  type="time"
                  step={1800}
                  value={time(day.endMinute % 1440)}
                  onChange={(e) =>
                    setDays(
                      days.map((d) =>
                        d === day
                          ? { ...d, endMinute: minute(e.target.value) || 1440 }
                          : d,
                      ),
                    )
                  }
                />
              </>
            )}
          </div>
        );
      })}
      <button className={button} disabled={save.isPending}>
        Save availability
      </button>
      {save.isSuccess && <p className="text-green-700">Availability saved.</p>}
      {save.error && (
        <p role="alert" className="text-red-600">
          {save.error.message}
        </p>
      )}
    </form>
  );
}
