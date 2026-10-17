"use client";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, type Category } from "@/lib/nexadvisor-api";
export function Footer() {
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="responsive-shell px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center mb-4">
              <Briefcase className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white">
                NexAdvisor
              </span>
            </Link>
            <p className="text-sm">
              Connecting experts with clients for professional consultations
              worldwide.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Categories
            </h2>
            <ul>
              {categories.data?.map((c) => (
                <li key={c.id}>
                  <Link
                    className="footer-link hover:text-white"
                    href={"/experts?category=" + encodeURIComponent(c.id)}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  className="footer-link hover:text-white"
                  href="/categories"
                >
                  Browse all categories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Explore</h2>
            <ul>
              {[
                ["/experts", "Find experts"],
                ["/how-it-works", "How it works"],
                ["/signup", "Become a member"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link className="footer-link hover:text-white" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Your account
            </h2>
            <ul>
              {[
                ["/dashboard", "Dashboard"],
                ["/bookings", "Bookings"],
                ["/messages", "Messages"],
                ["/forgot-password", "Reset password"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link className="footer-link hover:text-white" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-sm text-center">
          <p>© {new Date().getFullYear()} NexAdvisor. All rights reserved.</p>
          <p className="text-gray-400 mt-2">
            Demo payments are simulated. No real money is charged.
          </p>
        </div>
      </div>
    </footer>
  );
}
