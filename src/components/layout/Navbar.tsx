"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const header = useRef<HTMLElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) {
        setOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const close = () => {
    setOpen(false);
    setAccountOpen(false);
  };
  const primary = user
    ? [
        ["/experts", "Find experts"],
        ["/bookings", "My bookings"],
        ["/messages", "Messages"],
      ]
    : [
        ["/experts", "Find experts"],
        ["/categories", "Categories"],
        ["/how-it-works", "How it works"],
      ];
  const account = [
    ["/dashboard", "Overview"],
    ["/favorites", "Saved experts"],
    ["/payments", "Payments"],
    ["/profile", "My profile"],
    ["/categories", "Browse categories"],
    ["/how-it-works", "How it works"],
  ];
  if (user?.role === "expert")
    account.push(["/expert-onboarding", "Expert settings"]);
  if (user?.role === "admin") account.push(["/admin", "Admin"]);
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      close();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSigningOut(false);
    }
  };
  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={close}
      aria-current={active(href) ? "page" : undefined}
      className={
        "block rounded-lg px-4 py-3 text-sm font-medium transition-colors " +
        (active(href)
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")
      }
    >
      {label}
    </Link>
  );
  const logoutButton = (
    <button
      disabled={signingOut}
      onClick={logout}
      className="flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
    >
      <LogOut size={15} />
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
  return (
    <header
      ref={header}
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (accountOpen) accountButton.current?.focus();
          else if (open) mobileButton.current?.focus();
          close();
        }
      }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          onClick={close}
          aria-label="NexAdvisor home"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Briefcase size={21} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Nex<span className="text-blue-600">Advisor</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {primary.map(([href, label]) => link(href, label))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                ref={accountButton}
                aria-expanded={accountOpen}
                aria-controls="account-navigation"
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-3 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 hover:border-blue-200 transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-28 truncate text-sm font-medium text-slate-700">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {accountOpen && (
                <nav
                  id="account-navigation"
                  aria-label="Account navigation"
                  className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
                >
                  <div className="mb-1 border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">
                      {user.name}
                    </p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {user.role} account
                    </p>
                  </div>
                  {account.map(([href, label]) => link(href, label))}
                  {logoutButton}
                </nav>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-3 text-sm font-semibold text-slate-700 hover:text-blue-600"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Get started
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
        <button
          ref={mobileButton}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-slate-100 bg-white px-4 pb-5 pt-3 lg:hidden"
        >
          {primary.map(([href, label]) => link(href, label))}
          {user ? (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your account
              </p>
              {account.map(([href, label]) => link(href, label))}
              {logoutButton}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <Link
                href="/login"
                onClick={close}
                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={close}
                className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
