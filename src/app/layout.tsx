import type { Metadata } from "next";
import { Suspense } from "react";
import { Providers } from "./providers";
import "../index.css";
export const metadata: Metadata = {
  title: {
    default: "NexAdvisor - Connect with Expert Consultants",
    template: "%s | NexAdvisor",
  },
  description:
    "Find and book one-to-one consultations across business, technology, finance, career, and academic topics.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense
          fallback={
            <div className="p-12 text-center">Loading NexAdvisor...</div>
          }
        >
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
