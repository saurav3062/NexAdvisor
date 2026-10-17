"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api, clearCsrf } from "@/lib/nexadvisor-api";
import { Workspace, card, input, button } from "@/features/shared/Workspace";
export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const tokenRead = useRef(false);
  useEffect(() => {
    if (reset && !tokenRead.current) {
      tokenRead.current = true;
      setToken(
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
      );
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [reset]);
  const action = useMutation({
    mutationFn: () =>
      reset
        ? api<{ message: string }>("/auth/reset-password", "POST", {
            token,
            password,
          })
        : api<{ message: string }>("/auth/forgot-password", "POST", { email }),
    onSuccess: () => {
      if (reset) {
        clearCsrf();
        setPassword("");
        setConfirm("");
      }
    },
  });
  return (
    <Workspace title={reset ? "Choose a new password" : "Reset your password"}>
      <div className={card + " max-w-lg mx-auto"}>
        {action.isSuccess ? (
          <div role="status">
            <p>{action.data.message}</p>
            <Link className={button + " mt-5"} href="/login">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reset || password === confirm) action.mutate();
            }}
          >
            <p>
              {reset
                ? "Your reset link works once and expires after 30 minutes. All existing sessions will be signed out."
                : "Enter your account email. If it is registered, we’ll send a password reset link."}
            </p>
            {reset ? (
              <>
                <label className="block">
                  New password
                  <input
                    className={input}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={10}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="block">
                  Confirm new password
                  <input
                    className={input}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={10}
                    maxLength={128}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
                {confirm && password !== confirm && (
                  <p role="alert" className="text-red-600">
                    Passwords must match.
                  </p>
                )}
                {!token && (
                  <p role="alert">
                    This page needs a reset link from your email.{" "}
                    <Link href="/forgot-password" className="underline">
                      Request a new link
                    </Link>
                    .
                  </p>
                )}
              </>
            ) : (
              <label className="block">
                Email address
                <input
                  className={input}
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {action.error && (
              <p role="alert" className="text-red-600">
                {action.error.message}
              </p>
            )}
            <button
              className={button}
              disabled={
                action.isPending || (reset && (!token || password !== confirm))
              }
            >
              {action.isPending
                ? "Please wait…"
                : reset
                  ? "Update password"
                  : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </Workspace>
  );
}
