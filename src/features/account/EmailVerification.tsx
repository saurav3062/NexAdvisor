"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/nexadvisor-api";
import { Workspace, card, button } from "@/features/shared/Workspace";
export function VerificationBanner() {
  const pathname = usePathname();
  const { user } = useAuth();
  const resend = useMutation({
    mutationFn: () =>
      api<{ message: string }>("/auth/resend-verification", "POST"),
  });
  if (
    !user ||
    user.emailVerified ||
    user.role === "admin" ||
    pathname === "/verify-email"
  )
    return null;
  return (
    <aside
      className="bg-amber-50 border-b border-amber-200 px-4 py-4 text-amber-950"
      aria-label="Email verification"
    >
      <div className="max-w-7xl mx-auto">
        <p>
          Verify your email before booking a session or submitting an expert
          profile. Check your inbox for your verification link.
        </p>
        <button
          className="underline mt-2"
          disabled={resend.isPending}
          onClick={() => resend.mutate()}
        >
          {resend.isPending ? "Sending…" : "Resend verification email"}
        </button>
        {resend.data && (
          <p role="status" className="mt-2">
            {resend.data.message}
          </p>
        )}
        {resend.error && (
          <p role="alert" className="mt-2">
            {resend.error.message}
          </p>
        )}
      </div>
    </aside>
  );
}
export function EmailVerification() {
  const [token, setToken] = useState("");
  const read = useRef(false);
  useEffect(() => {
    if (!read.current) {
      read.current = true;
      setToken(
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
      );
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  const action = useMutation({
    mutationFn: () =>
      api<{ message: string }>("/auth/verify-email", "POST", { token }),
  });
  return (
    <Workspace title="Verify your email">
      <div className={card + " max-w-lg mx-auto space-y-5"}>
        {action.isSuccess ? (
          <>
            <p role="status">{action.data.message}</p>
            <a className={button} href="/dashboard">
              Continue to your account
            </a>
          </>
        ) : (
          <>
            <p>
              Confirm your email to finish setting up your account. Verification
              links expire after 24 hours and work once.
            </p>
            {token ? (
              <button
                className={button}
                disabled={action.isPending}
                onClick={() => action.mutate()}
              >
                {action.isPending ? "Verifying…" : "Verify email"}
              </button>
            ) : (
              <p>
                Open the verification link from your email. If you need a new
                one, sign in and use the resend button.
              </p>
            )}
            {action.error && (
              <p role="alert" className="text-red-600">
                {action.error.message}
              </p>
            )}
            <Link className="block text-blue-600" href="/login">
              Sign in to request a new link
            </Link>
          </>
        )}
      </div>
    </Workspace>
  );
}
