export interface Account {
  emailVerified: boolean;
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "EXPERT" | "ADMIN";
  bio: string;
  location: string;
}
export interface ExpertProfile {
  photoVersion: string;
  id: string;
  accountId: string;
  name: string;
  categoryId: string;
  category: string;
  title: string;
  bio: string;
  hourlyRateMinor: number;
  currency: string;
  yearsExperience: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string;
  location: string;
  rating: number;
  reviewCount: number;
}
export interface Category {
  id: string;
  name: string;
  description: string;
  expertCount: number;
  averagePrice: number;
}
export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  amountMinor: number;
  currency: string;
}
export interface Booking {
  id: string;
  expertId: string;
  expertAccountId: string;
  clientId: string;
  expertName: string;
  clientName: string;
  startsAt: string;
  endsAt: string;
  amountMinor: number;
  currency: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes: string;
  paymentStatus: string;
  expiresAt: string | null;
}
export interface Payment {
  id: string;
  bookingId: string;
  amountMinor: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
  expertName: string;
  clientName: string;
}
export interface Hours {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}
export interface Review {
  id: string;
  bookingId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}
export interface Config {
  paymentMode: string;
  simulationEnabled: boolean;
  currency: string;
  scheduleTimezone: string;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const SESSION_EXPIRED = "nexadvisor:session-expired";
let token: Promise<{ token: string; headerName: string }> | undefined;
export function clearCsrf() {
  token = undefined;
}
async function csrf() {
  if (!token)
    token = fetch("/api/v1/csrf", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new ApiError(response.status, "Could not initialize session");
        return response.json();
      })
      .catch((error) => {
        token = undefined;
        throw error;
      });
  return token;
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const auth = await csrf();
    headers[auth.headerName] = auth.token;
  }
  const response = await fetch("/api/v1" + path, {
    method,
    headers,
    credentials: "include",
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      clearCsrf();
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event(SESSION_EXPIRED));
    }
    if (response.status === 403) clearCsrf();
    const problem = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      problem?.message ||
        (response.status === 401
          ? "Please sign in to continue"
          : response.status === 403
            ? "This action is not allowed. Refresh and try again."
            : "The request failed. Please try again."),
    );
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
export const money = (amountMinor: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amountMinor / 100,
  );
