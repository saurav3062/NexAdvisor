"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/nexadvisor-api";
import {
  Workspace,
  QueryState,
  card,
  input,
  button,
} from "@/features/shared/Workspace";
export interface DeletionRequest {
  accountId: string;
  status: string;
  reason: string;
  response: string;
  createdAt: string;
}
export function PrivacyRequests() {
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const cache = useQueryClient();
  const q = useQuery({
    queryKey: ["deletion"],
    queryFn: () => api<DeletionRequest[]>("/me/deletion-requests"),
  });
  const save = useMutation({
    mutationFn: () => api("/me/deletion-requests", "POST", { reason }),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["deletion"] }),
  });
  return (
    <Workspace title="Privacy & account closure">
      <CloseAccount />
      <div className={card + " max-w-2xl space-y-4"}>
        <h2 className="text-xl font-semibold">Request account deletion</h2>
        <p>
          We review your request and resolve outstanding appointments, disputes,
          and held payments before closing your account. You can continue using
          your account during review.
        </p>
        <p>
          Once processed, your profile and authored messages are removed or
          anonymized and access is revoked. Restricted transaction and audit
          records may remain; backups and previously delivered communications
          require separate retention handling. Contact support@nexadvisor.in for
          details or to withdraw your request.
        </p>
        <QueryState loading={q.isLoading} error={q.error} />
        {q.data?.length === 0 && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <label className="block">
              Request details
              <textarea
                required
                minLength={10}
                maxLength={1000}
                className={input}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please close my account and remove my profile."
              />
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                required
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
              />
              I want to request account closure and understand that outstanding
              bookings need to be resolved.
            </label>
            <button className={button} disabled={!confirm || save.isPending}>
              Submit deletion request
            </button>
          </form>
        )}
        {q.data?.map((r) => (
          <div key={r.accountId} className="bg-blue-50 rounded-lg p-4">
            <strong>{r.status.replaceAll("_", " ")}</strong>
            <p className="whitespace-pre-wrap">
              {r.response || "Your request is awaiting review."}
            </p>
          </div>
        ))}
        {save.error && (
          <p role="alert" className="text-red-600">
            {save.error.message}
          </p>
        )}
      </div>
    </Workspace>
  );
}

function CloseAccount() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [done, setDone] = useState(false);
  const cache = useQueryClient();
  const close = useMutation({
    mutationFn: () =>
      api("/me/close-account", "POST", { password, confirmation }),
    onSuccess: () => {
      setPassword("");
      setDone(true);
      cache.clear();
      window.location.replace("/login?account=closed");
    },
  });
  if (done)
    return (
      <section className={card + " max-w-2xl mb-6"} role="status">
        <h2 className="text-xl font-semibold">Your account is closed</h2>
        <p className="my-3">
          Your profile has been anonymized and account access revoked.
        </p>
        <a href="/login" className="text-blue-600">
          Return to sign in
        </a>
      </section>
    );
  return (
    <form
      className={card + " max-w-2xl mb-6 space-y-4"}
      onSubmit={(e) => {
        e.preventDefault();
        if (
          window.confirm(
            "Permanently close your account? This removes your profile and cannot be undone.",
          )
        )
          close.mutate();
      }}
    >
      <h2 className="text-xl font-semibold">Close your account</h2>
      <p>
        Verified accounts can close immediately once all bookings, support
        issues and held payments are resolved. Your profile and authored content
        are anonymized, and all sessions are signed out. Restricted transaction
        and audit records are retained. Previously delivered messages and
        backups follow separate retention handling.
      </p>
      <p>
        If there are outstanding obligations, use the supported deletion request
        below. Administrators must arrange account closure with another
        operator.
      </p>
      <label className="block">
        Current password
        <input
          type="password"
          required
          autoComplete="current-password"
          maxLength={128}
          className={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="block">
        Type DELETE to confirm
        <input
          required
          pattern="DELETE"
          autoComplete="off"
          className={input}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </label>
      <button
        className="rounded-lg border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50"
        disabled={close.isPending || confirmation !== "DELETE" || !password}
      >
        {close.isPending ? "Closing account…" : "Permanently close account"}
      </button>
      {close.error && (
        <p role="alert" className="text-red-700">
          {close.error.message}
        </p>
      )}
    </form>
  );
}
