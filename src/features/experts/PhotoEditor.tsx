"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ExpertProfile } from "@/lib/nexadvisor-api";
import { ExpertAvatar } from "./ExpertAvatar";
import { button, card } from "@/features/shared/Workspace";

export function PhotoEditor({ expert }: { expert: ExpertProfile }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: (data: string) =>
      api<ExpertProfile>("/me/expert/photo", "PUT", { data }),
    onSuccess: (updated) => {
      setPreview("");
      cache.setQueryData(["my-expert"], updated);
      for (const key of [
        "experts",
        "featured-experts",
        "expert",
        "favorites",
        "categories",
        "pending-experts",
      ])
        cache.invalidateQueries({ queryKey: [key] });
    },
  });
  return (
    <section id="profile-photo" className={card + " space-y-4 scroll-mt-28"}>
      <div>
        <h2 className="text-xl font-semibold">Your profile photo</h2>
        <p className="mt-1 text-sm text-slate-500">
          A clear portrait helps clients recognize you. JPEG or PNG, up to 2 MB
          and 4096 × 4096 pixels. Photos are center-cropped to a square.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        {preview ? (
          <img
            src={preview}
            width={96}
            height={96}
            alt="Selected photo preview"
            className="h-24 w-24 rounded-2xl object-cover"
          />
        ) : (
          <ExpertAvatar expert={expert} large />
        )}
        <label className="block min-w-0 text-sm font-medium">
          Choose a portrait
          <input
            type="file"
            accept="image/jpeg,image/png"
            disabled={save.isPending || reading}
            className="mt-2 block w-full max-w-sm text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              setError("");
              save.reset();
              setPreview("");
              if (!file) return;
              if (
                !["image/jpeg", "image/png"].includes(file.type) ||
                file.size > 2 * 1024 * 1024
              ) {
                setError("Choose a JPEG or PNG photo under 2 MB.");
                return;
              }
              setReading(true);
              const reader = new FileReader();
              reader.onload = () => {
                setPreview(String(reader.result));
                setReading(false);
              };
              reader.onerror = () => {
                setError("That file could not be read. Try another photo.");
                setReading(false);
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Photo changes are reviewed before your profile appears publicly. Keep
        your face near the center.
      </p>
      <div className="flex flex-wrap gap-3">
        {preview && (
          <button
            className={button}
            disabled={save.isPending || reading}
            onClick={() => save.mutate(preview.split(",")[1])}
          >
            {save.isPending ? "Saving…" : "Save photo"}
          </button>
        )}
        {expert.photoVersion && (
          <button
            className="rounded-lg border px-4 py-2 text-sm"
            disabled={save.isPending || reading}
            onClick={() => save.mutate("")}
          >
            Remove photo
          </button>
        )}
      </div>
      {(error || save.error) && (
        <p role="alert" className="text-sm text-red-700">
          {error || save.error?.message}
        </p>
      )}
      {save.isSuccess && (
        <p role="status" className="text-sm text-green-700">
          Photo updated. Your profile is awaiting review.
        </p>
      )}
    </section>
  );
}
