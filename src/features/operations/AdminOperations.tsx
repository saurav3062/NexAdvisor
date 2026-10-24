"use client";

import { useState } from "react";

import Link from "next/link";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api, money } from "@/lib/nexadvisor-api";

import { usePaged, LoadMore } from "@/features/shared/Pagination";

import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";

import type { SupportCase } from "./Support";

import type { DeletionRequest } from "./PrivacyRequests";

interface Health {
  failedEmails: number;
  openIssues: number;
  deletionRequests: number;
  missingMeetingLinks: number;
  publishedDemoExperts: number;
  checks: { check_key: string; evidence: string; checked_at: string }[];
}

interface Reconciliation {
  mode: string;
  checkedAt: string;
  anomalies: string[];
  totals: {
    currency: string;
    gross_minor: number;
    commission_minor: number;
    net_minor: number;
    payout_status: string;
    count: number;
  }[];
}

export function AdminOperations() {
  const cache = useQueryClient();
  const [tab, setTab] = useState("Overview");
  const health = useQuery({
    queryKey: ["operations"],
    queryFn: () => api<Health>("/admin/operations"),
  });
  const reconcile = useQuery({
    queryKey: ["reconciliation"],
    queryFn: () => api<Reconciliation>("/admin/reconciliation"),
  });
  const cases = usePaged<SupportCase>(["admin-support"], "/admin/support");
  const deletions = usePaged<DeletionRequest>(
    ["admin-deletions"],
    "/admin/deletion-requests",
  );
  const [check, setCheck] = useState("DESKTOP_MEETING"),
    [evidence, setEvidence] = useState("");
  const action = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) =>
      api(path, "POST", body),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["operations"] });
      cache.invalidateQueries({ queryKey: ["admin-support"] });
      cache.invalidateQueries({ queryKey: ["admin-deletions"] });
      cache.invalidateQueries({ queryKey: ["reconciliation"] });
    },
  });
  return (
    <Workspace title="Operations desk">
      <nav className="flex flex-wrap gap-3 mb-6" aria-label="Administration">
        <Link className="text-blue-600" href="/admin">
          Expert applications
        </Link>
        <Link className="text-blue-600" href="/admin/settlements">
          Expert settlements
        </Link>
        <Link className="text-blue-600" href="/admin/accounts">
          Accounts & operator history
        </Link>
      </nav>
      <div
        className="flex flex-wrap gap-2 mb-6"
        aria-label="Operations sections"
      >
        {["Overview", "Support", "Deletion requests", "Launch checks"].map(
          (t) => (
            <button
              key={t}
              aria-pressed={tab === t}
              className={tab === t ? button : "px-4 py-2 rounded-lg border"}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ),
        )}
      </div>
      {action.error && (
        <p role="alert" className="text-red-600 mb-4">
          {action.error.message}
        </p>
      )}
      {action.isSuccess && (
        <p role="status" className="text-green-700 mb-4">
          Saved successfully.
        </p>
      )}

      {tab === "Overview" && (
        <>
          <QueryState loading={health.isLoading} error={health.error} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {health.data &&
              [
                ["Open support cases", health.data.openIssues],
                ["Deletion requests", health.data.deletionRequests],
                [
                  "Meetings without links (24h)",
                  health.data.missingMeetingLinks,
                ],
                ["Failed email jobs", health.data.failedEmails],
              ].map(([label, n]) => (
                <div className={card} key={label}>
                  <p className="text-sm text-slate-500">{label}</p>
                  <strong className="text-3xl">{n}</strong>
                </div>
              ))}
          </div>
          <section className={card}>
            <h2 className="text-xl font-semibold">Financial reconciliation</h2>
            <p className="text-sm text-slate-500 my-2">
              Internal simulator ledger check. This does not reconcile against
              Cashfree or a bank.
            </p>
            <QueryState loading={reconcile.isLoading} error={reconcile.error} />
            {reconcile.data && (
              <>
                <p
                  className={
                    reconcile.data.anomalies.length
                      ? "text-red-600"
                      : "text-green-700"
                  }
                >
                  {reconcile.data.anomalies.length} inconsistencies found ·{" "}
                  {new Date(reconcile.data.checkedAt).toLocaleString()}
                </p>
                {reconcile.data.anomalies.map((id) => (
                  <p className="break-all" key={id}>
                    {id}
                  </p>
                ))}
                {reconcile.data.totals.map((t) => (
                  <p
                    key={t.currency + t.payout_status}
                    className="border-t py-3 mt-2"
                  >
                    {t.currency} · {t.payout_status.replaceAll("_", " ")} ·{" "}
                    {t.count} payments · Gross{" "}
                    {money(t.gross_minor, t.currency)} · Expert share{" "}
                    {money(t.net_minor, t.currency)}
                  </p>
                ))}
              </>
            )}
            <button
              className="text-blue-600 mt-3"
              disabled={reconcile.isFetching}
              onClick={() => reconcile.refetch()}
            >
              Run reconciliation
            </button>
          </section>
        </>
      )}

      {tab === "Support" && (
        <>
          <QueryState loading={cases.isLoading} error={cases.error} />
          {cases.data?.length === 0 && <p>No support cases.</p>}
          <div className="space-y-4">
            {cases.data?.map((c) => (
              <CaseReview key={c.id} item={c} />
            ))}
          </div>
          <LoadMore query={cases} />
        </>
      )}

      {tab === "Deletion requests" && (
        <>
          <p className="mb-4 text-slate-600">
            Review identity and outstanding obligations first. Anonymization is
            irreversible. Financial and audit records remain restricted;
            separately handle stored email previews, provider data and backups
            according to your retention policy.
          </p>
          <QueryState loading={deletions.isLoading} error={deletions.error} />
          {deletions.data?.map((r) => (
            <DeletionReview key={r.accountId} item={r} />
          ))}
          {deletions.data?.length === 0 && <p>No deletion requests.</p>}
          <LoadMore query={deletions} />
        </>
      )}

      {tab === "Launch checks" && (
        <div className="space-y-6">
          <section className={card}>
            <h2 className="text-xl font-semibold">Public directory</h2>
            <p className="my-3">
              {health.data?.publishedDemoExperts ?? "…"} known fictional demo
              profiles are published. Removing them preserves appointment
              history.
            </p>
            <button
              className={button}
              disabled={action.isPending || !health.data?.publishedDemoExperts}
              onClick={() => {
                if (
                  window.confirm("Unpublish the known fictional demo profiles?")
                )
                  action.mutate({ path: "/admin/unpublish-demo" });
              }}
            >
              Unpublish demo profiles
            </button>
          </section>
          <form
            className={card + " space-y-4"}
            onSubmit={(e) => {
              e.preventDefault();
              action.mutate({
                path: "/admin/launch-checks/" + check,
                body: { note: evidence },
              });
            }}
          >
            <h2 className="text-xl font-semibold">
              Record a completed real-world check
            </h2>
            <p>
              Record only checks actually performed. Include date, environment,
              device or restore reference, result, and reviewer. Never paste
              credentials or identity documents.
            </p>
            <label className="block">
              Check
              <select
                className={input}
                value={check}
                onChange={(e) => setCheck(e.target.value)}
              >
                {[
                  "EXPERT_IDENTITY",
                  "IOS_MEETING",
                  "ANDROID_MEETING",
                  "DESKTOP_MEETING",
                  "RESTORE_DRILL",
                  "OFFSITE_BACKUP",
                  "HTTPS",
                  "POLICY_REVIEW",
                ].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label className="block">
              Evidence
              <textarea
                required
                minLength={10}
                maxLength={1800}
                className={input}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </label>
            <button className={button} disabled={action.isPending}>
              Record check
            </button>
          </form>
          {health.data?.checks.map((c) => (
            <article className={card} key={c.check_key}>
              <strong>{c.check_key.replaceAll("_", " ")}</strong>
              <p className="text-sm text-slate-500">
                {new Date(c.checked_at).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap">{c.evidence}</p>
            </article>
          ))}
        </div>
      )}
    </Workspace>
  );
}

function CaseReview({ item: c }: { item: SupportCase }) {
  const [outcome, setOutcome] = useState("NO_REFUND"),
    [note, setNote] = useState("");
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: (reopen: boolean = false) =>
      api("/admin/support/" + c.id + "/resolve", "POST", {
        outcome: reopen ? "REOPEN" : outcome,
        note: reopen ? "Reopened by support for follow-up review" : note,
      }),
    onSuccess: () => cache.invalidateQueries(),
  });
  return (
    <form
      className={card + " space-y-3"}
      onSubmit={(e) => {
        e.preventDefault();
        if (
          window.confirm(
            "Apply this resolution? Any money movement remains simulated.",
          )
        )
          save.mutate(false);
      }}
    >
      <h2 className="font-semibold">
        {c.category.replaceAll("_", " ")} · {c.status}
      </h2>
      <p className="text-xs break-all">
        Case {c.id} · Booking {c.bookingId}
      </p>
      <p className="whitespace-pre-wrap">{c.description}</p>
      {c.status === "OPEN" ? (
        <>
          <label className="block">
            Outcome
            <select
              className={input}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="NO_REFUND">
                Resolve without changing payment
              </option>
              <option value="FULL_REFUND">
                Cancel and issue full simulated refund
              </option>
              <option value="ATTENDED">
                Both attended; mark ended session completed
              </option>
              <option value="CLIENT_NO_SHOW">
                Client did not attend; hold funds for review
              </option>
              <option value="EXPERT_NO_SHOW">
                Expert did not attend; hold funds for review
              </option>
              <option value="NO_SHOW">
                Record no-show; hold funds for review
              </option>
            </select>
          </label>
          <label className="block">
            Response to participant
            <textarea
              required
              minLength={10}
              maxLength={1800}
              className={input}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button className={button} disabled={save.isPending}>
            Resolve case
          </button>
        </>
      ) : (
        <div>
          <p>
            {c.resolution} · {c.response}
          </p>
          <button
            type="button"
            className="text-blue-600 mt-3"
            disabled={save.isPending}
            onClick={() => save.mutate(true)}
          >
            Reopen for follow-up
          </button>
        </div>
      )}
      {save.error && (
        <p role="alert" className="text-red-600">
          {save.error.message}
        </p>
      )}
    </form>
  );
}

function DeletionReview({ item: r }: { item: DeletionRequest }) {
  const [note, setNote] = useState("");
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: (kind: string) =>
      api("/admin/deletion-requests/" + r.accountId + "/" + kind, "POST", {
        note,
      }),
    onSuccess: () => cache.invalidateQueries(),
  });
  return (
    <form
      className={card + " space-y-3 mb-4"}
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate("review");
      }}
    >
      <h2 className="font-semibold">
        {r.status} · {r.accountId.slice(0, 8)}
      </h2>
      <p className="whitespace-pre-wrap">{r.reason}</p>
      <p>{r.response}</p>
      {r.status !== "ANONYMIZED" && (
        <>
          <label className="block">
            Review note
            <textarea
              required
              minLength={10}
              maxLength={1800}
              className={input}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button className={button} disabled={save.isPending}>
              Save review response
            </button>
            {r.status === "IN_REVIEW" && (
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-red-300 text-red-700"
                disabled={save.isPending || note.trim().length < 10}
                onClick={() => {
                  if (
                    window.confirm(
                      "Permanently anonymize this account and revoke access? Resolve all outstanding obligations and verify the request first.",
                    )
                  )
                    save.mutate("anonymize");
                }}
              >
                Anonymize account
              </button>
            )}
          </div>
        </>
      )}
      {save.error && (
        <p role="alert" className="text-red-600">
          {save.error.message}
        </p>
      )}
    </form>
  );
}
