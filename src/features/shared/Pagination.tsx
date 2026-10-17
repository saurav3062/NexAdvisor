"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/nexadvisor-api";
import { button } from "./Workspace";
export function usePaged<T>(key: string[], path: string, refresh?: number) {
  const q = useInfiniteQuery({
    queryKey: key,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<T[]>(path + (path.includes("?") ? "&" : "?") + "offset=" + pageParam),
    getNextPageParam: (last, pages) =>
      last.length === 100 && pages.length * 100 <= 10000
        ? pages.length * 100
        : undefined,
    refetchInterval: refresh,
  });
  return { ...q, data: q.data?.pages.flat() };
}
export function LoadMore({
  query,
}: {
  query: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isFetchNextPageError: boolean;
    fetchNextPage: () => unknown;
  };
}) {
  return query.hasNextPage ? (
    <div className="mt-5">
      <button
        className={button}
        disabled={query.isFetchingNextPage}
        onClick={() => query.fetchNextPage()}
      >
        {query.isFetchingNextPage
          ? "Loading…"
          : query.isFetchNextPageError
            ? "Retry loading more"
            : "Load more"}
      </button>
    </div>
  ) : null;
}
