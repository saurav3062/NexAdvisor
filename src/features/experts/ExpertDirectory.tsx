"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExpertAvatar } from "./ExpertAvatar";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  MapPin,
  Star,
  Video,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  money,
  type ExpertProfile,
  type Category,
} from "@/lib/nexadvisor-api";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
export function ExpertTile({ expert: e }: { expert: ExpertProfile }) {
  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50">
      <div className="mb-5 flex items-start justify-between gap-3">
        <ExpertAvatar expert={e} />
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
          {e.category}
        </span>
      </div>
      <h2 className="break-words text-xl font-semibold tracking-tight text-slate-900">
        {e.name}
      </h2>
      <p className="mt-1 min-h-12 text-sm leading-6 text-slate-600 line-clamp-2">
        {e.title}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {e.reviewCount > 0 ? (
          <>
            <Star
              size={15}
              className="fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            <span className="font-semibold text-slate-800">
              {e.rating.toFixed(1)}
            </span>
            <span className="text-slate-500">
              ({e.reviewCount} {e.reviewCount === 1 ? "review" : "reviews"})
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-500">No reviews yet</span>
        )}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500 line-clamp-2">
        {e.bio}
      </p>
      <div className="mb-5 mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <BriefcaseBusiness size={14} aria-hidden="true" />
          {e.yearsExperience} years experience
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{e.location || "Remote"}</span>
        </span>
      </div>
      <div className="mt-auto border-t border-slate-100 pt-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">
              {money(e.hourlyRateMinor, e.currency)}
            </span>
            <span className="ml-1 text-xs text-slate-500">/ hour</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Video size={14} aria-hidden="true" />
            1:1 video call
          </span>
        </div>
        <Link
          className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white"
          href={"/experts/" + e.id}
          aria-label={"View profile and availability for " + e.name}
        >
          View profile & availability
          <ArrowUpRight size={17} className="shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
export function FeaturedExperts() {
  const q = useQuery({
    queryKey: ["featured-experts"],
    queryFn: () => api<ExpertProfile[]>("/experts?limit=6"),
  });
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-8">Meet Our Experts</h2>
      <QueryState loading={q.isLoading} error={q.error} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {q.data?.map((e) => (
          <ExpertTile expert={e} key={e.id} />
        ))}
      </div>
      {q.data?.length === 0 && (
        <p className="text-center">Approved experts will appear here.</p>
      )}
    </section>
  );
}
export function ExpertDirectory() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [sort, setSort] = useState("rating");
  const urlSearch = params.get("search") || "";
  const urlCategory = params.get("category") || "";
  useEffect(() => {
    setSearch(urlSearch);
    setCategory(urlCategory);
    setPage(0);
  }, [urlSearch, urlCategory]);
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  const q = useQuery({
    queryKey: ["experts", debouncedSearch, category, sort, page],
    queryFn: () =>
      api<ExpertProfile[]>(
        "/experts?" +
          new URLSearchParams({
            search: debouncedSearch,
            category,
            sort,
            limit: "12",
            offset: String(page * 12),
          }),
      ),
  });
  return (
    <Workspace title="Find Your Expert">
      <p className="text-gray-600 mb-6">
        Browse approved consultants and choose a time that works for you.
      </p>
      <div className="grid md:grid-cols-3 gap-3 mb-8">
        <input
          aria-label="Search experts"
          placeholder="Search by name or expertise"
          className={input}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <select
          aria-label="Category"
          className={input}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort experts"
          className={input}
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(0);
          }}
        >
          <option value="rating">Highest rated</option>
          <option value="experience">Most experienced</option>
          <option value="price">Price: low to high</option>
        </select>
      </div>
      <QueryState loading={q.isLoading} error={q.error} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {q.data?.map((e) => (
          <ExpertTile key={e.id} expert={e} />
        ))}
      </div>
      {q.data?.length === 0 && (
        <div className={card}>
          <p className="mb-4">
            No experts match your search. Try another category or clear your
            filters.
          </p>
          <button
            className={button}
            onClick={() => {
              setSearch("");
              setCategory("");
              setPage(0);
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {(page > 0 || q.data?.length === 12) && (
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            className={button}
            disabled={!page || q.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <button
            className={button}
            disabled={q.isFetching || q.data?.length !== 12}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </Workspace>
  );
}
export function Categories() {
  const q = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  return (
    <Workspace title="Browse Expert Categories">
      <QueryState loading={q.isLoading} error={q.error} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {q.data?.map((c) => (
          <Link href={"/experts?category=" + c.id} key={c.id} className={card}>
            <h2 className="text-xl font-semibold">{c.name}</h2>
            <p className="text-gray-600 my-3">{c.description}</p>
            <p className="text-blue-600">{c.expertCount} experts</p>
          </Link>
        ))}
      </div>
    </Workspace>
  );
}
