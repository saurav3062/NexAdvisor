"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/nexadvisor-api";
import { usePaged, LoadMore } from "@/features/shared/Pagination";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
interface Account {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  disabled: boolean;
}
interface Audit {
  id: string;
  actorId: string;
  targetId: string;
  action: string;
  note: string;
  createdAt: string;
}
export function AccountControls() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const accounts = usePaged<Account>(
    ["admin-accounts", search],
    "/admin/accounts?search=" + encodeURIComponent(search),
  );
  const audit = usePaged<Audit>(["admin-audit"], "/admin/audit");
  return (
    <Workspace title="Accounts & operator history">
      <Link className="text-blue-600" href="/admin/operations">
        ← Operations desk
      </Link>
      <p className="my-5 text-slate-600">
        Restrictions immediately revoke access and remove experts from the
        public directory. Existing appointments and financial records remain for
        support to resolve. Reinstated experts need profile approval before
        accepting new bookings.
      </p>
      <form
        className="flex flex-wrap items-end gap-3 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(draft.trim());
        }}
      >
        <label className="flex-1 min-w-0">
          Find an account
          <input
            className={input}
            maxLength={100}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Name or email"
          />
        </label>
        <button className={button}>Search</button>
      </form>
      <QueryState loading={accounts.isLoading} error={accounts.error} />
      <div className="space-y-4">
        {accounts.data?.map((a) => (
          <AccountRow key={a.id} account={a} />
        ))}
      </div>
      {accounts.data?.length === 0 && <p>No matching accounts.</p>}
      <LoadMore query={accounts} />
      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Operator action history</h2>
        <p className="text-sm text-slate-600">
          Restricted audit records include the operator, affected account or
          booking, reason and time.
        </p>
        <QueryState loading={audit.isLoading} error={audit.error} />
        {audit.data?.map((a) => (
          <article key={a.id} className={card}>
            <h3 className="font-semibold">{a.action.replaceAll("_", " ")}</h3>
            <p className="text-sm text-slate-500">
              {new Date(a.createdAt).toLocaleString()}
            </p>
            <p className="text-xs break-all my-2">
              Operator {a.actorId} · Target {a.targetId}
            </p>
            <p className="whitespace-pre-wrap">{a.note}</p>
          </article>
        ))}
        {audit.data?.length === 0 && <p>No recorded operator actions yet.</p>}
        <LoadMore query={audit} />
      </section>
    </Workspace>
  );
}
function AccountRow({ account: a }: { account: Account }) {
  const [note, setNote] = useState("");
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      api("/admin/accounts/" + a.id + "/restriction", "POST", {
        suspended: !a.suspended,
        note,
      }),
    onSuccess: () => {
      setNote("");
      cache.invalidateQueries();
    },
  });
  return (
    <form
      className={card + " space-y-3"}
      onSubmit={(e) => {
        e.preventDefault();
        if (
          window.confirm(
            a.suspended
              ? "Restore this account’s access? Any expert profile will still need approval."
              : "Restrict this account and sign out all sessions? Existing bookings will require support coordination.",
          )
        )
          save.mutate();
      }}
    >
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2 className="font-semibold">{a.name}</h2>
          <p className="break-all text-sm">{a.email}</p>
        </div>
        <p>
          {a.role} ·{" "}
          {a.disabled ? "Closed" : a.suspended ? "Restricted" : "Active"}
        </p>
      </div>
      {!a.disabled && a.role !== "ADMIN" && (
        <>
          <label className="block">
            Operator reason
            <textarea
              required
              minLength={10}
              maxLength={1800}
              className={input}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record why this access change is needed."
            />
          </label>
          <button className={button} disabled={save.isPending}>
            {a.suspended ? "Restore access" : "Restrict access"}
          </button>
        </>
      )}
      {save.error && (
        <p role="alert" className="text-red-700">
          {save.error.message}
        </p>
      )}
    </form>
  );
}
