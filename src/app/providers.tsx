"use client";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ApiError } from "@/lib/nexadvisor-api";
import { NetworkNotice } from "@/components/common/NetworkNotice";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppErrorBoundary } from "@/components/common/ErrorBoundary";
import { Navbar } from "@/components/layout/Navbar";
import { VerificationBanner } from "@/features/account/EmailVerification";
import { Footer } from "@/components/layout/Footer";
import { initAnalytics, trackError } from "@/lib/analytics";
import "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: { retry: false },
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: (count, error) =>
              count < 1 &&
              (!(error instanceof ApiError) ||
                error.status === 0 ||
                error.status >= 500),
            refetchOnWindowFocus: true,
          },
        },
      }),
  );
  useEffect(() => {
    initAnalytics();
    const onError = (event: ErrorEvent) =>
      trackError(event.error || new Error(event.message), "global");
    const onRejection = (event: PromiseRejectionEvent) =>
      trackError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        "promise",
      );
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <AppErrorBoundary>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <a href="#main-content" className="skip-content">
              Skip to content
            </a>
            <Navbar />
            <VerificationBanner />
            <NetworkNotice />
            <main id="main-content" className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster position="top-right" />
        </AppErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}
