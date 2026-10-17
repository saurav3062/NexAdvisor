"use client";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, type ExpertProfile } from "@/lib/nexadvisor-api";
import { Workspace, QueryState, button } from "@/features/shared/Workspace";
import { usePaged, LoadMore } from "@/features/shared/Pagination";
import { ExpertTile } from "./ExpertDirectory";
export function FavoriteButton({ id }: { id: string }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const q = useQuery({
    queryKey: ["favorite", id],
    queryFn: () => api<{ favorite: boolean }>("/me/favorites/" + id),
    enabled: !!user,
  });
  const action = useMutation({
    mutationFn: () =>
      api("/me/favorites/" + id, q.data?.favorite ? "DELETE" : "PUT"),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["favorite", id] });
      cache.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
  if (!user)
    return (
      <Link
        className="text-blue-600"
        href={"/login?next=" + encodeURIComponent("/experts/" + id)}
      >
        Sign in to save this expert
      </Link>
    );
  return (
    <div>
      <button
        className={button}
        aria-pressed={!!q.data?.favorite}
        disabled={q.isLoading || !!q.error || action.isPending}
        onClick={() => action.mutate()}
      >
        {action.isPending
          ? "Saving…"
          : q.data?.favorite
            ? "Remove from saved experts"
            : "Save expert"}
      </button>
      {(q.error || action.error) && (
        <p role="alert" className="text-red-600 mt-2">
          {(q.error || action.error)?.message}
        </p>
      )}
    </div>
  );
}
export function Favorites() {
  const q = usePaged<ExpertProfile>(["favorites"], "/me/favorites");
  return (
    <Workspace title="Saved experts">
      <p className="text-gray-600 mb-6">
        Keep a shortlist of experts you’d like to book. Only currently approved
        profiles appear here.
      </p>
      <QueryState loading={q.isLoading} error={q.error} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {q.data?.map((e) => (
          <ExpertTile key={e.id} expert={e} />
        ))}
      </div>
      {q.data?.length === 0 && (
        <p>
          No saved experts yet.{" "}
          <Link className="text-blue-600" href="/experts">
            Find an expert
          </Link>
        </p>
      )}
      <LoadMore query={q} />
    </Workspace>
  );
}
