"use client";
import { useState } from "react";
import type { ExpertProfile } from "@/lib/nexadvisor-api";

export function ExpertAvatar({
  expert,
  large = false,
}: {
  expert: ExpertProfile;
  large?: boolean;
}) {
  const [failed, setFailed] = useState("");
  const src = expert.photoVersion
    ? `/api/v1/experts/${expert.id}/photo?v=${expert.photoVersion}`
    : "";
  const size = large ? "h-24 w-24" : "h-16 w-16";
  return src && failed !== src ? (
    <img
      src={src}
      alt={expert.name + " profile photo"}
      width={large ? 96 : 64}
      height={large ? 96 : 64}
      loading="lazy"
      onError={() => setFailed(src)}
      className={
        size + " shrink-0 rounded-2xl border border-slate-200 object-cover"
      }
    />
  ) : (
    <div
      aria-label={expert.name}
      className={
        size +
        " flex shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-xl font-semibold text-blue-700"
      }
    >
      {expert.name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0])
        .join("")}
    </div>
  );
}
