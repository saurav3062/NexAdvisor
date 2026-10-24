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
  scheduleTimezone: string;
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
    public requestId?: string,
  ) {
    super(message);
  }
}
export const SESSION_EXPIRED = "nexadvisor:session-expired";
let token: Promise<{ token: string; headerName: string }> | undefined;
export function clearCsrf() {
  token = undefined;
}
async function request(
  path: string,
  method = "GET",
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("/api/v1" + path, {
      method,
      headers,
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data: unknown = null;
    let malformed = false;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        malformed = true; /* Proxies may return an HTML error. */
      }
    }
    if (response.ok && malformed)
      throw new ApiError(
        502,
        "The server returned an unexpected response. Check the current status before retrying.",
      );
    return { response, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      0,
      method === "GET"
        ? "Could not load data. Check your connection and try again."
        : "Could not confirm the result. Check the latest status before trying again; your change may have been saved.",
    );
  } finally {
    clearTimeout(timer);
  }
}
async function csrf() {
  if (!token)
    token = request("/csrf")
      .then(({ response, data }) => {
        const result = data as { token?: string; headerName?: string } | null;
        if (!response.ok || !result?.token || !result.headerName)
          throw new ApiError(
            response.status,
            "Could not initialize your session. Refresh and try again.",
          );
        return { token: result.token, headerName: result.headerName };
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
  const { response, data } = await request(path, method, body, headers);
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      clearCsrf();
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event(SESSION_EXPIRED));
    }
    if (response.status === 403) clearCsrf();
    const problem = data as { message?: string; requestId?: string } | null;
    const reference =
      problem?.requestId || response.headers.get("X-Request-ID") || undefined;
    const message =
      problem?.message ||
      (response.status === 401
        ? "Please sign in to continue"
        : response.status === 403
          ? "This action is not allowed. Refresh and try again."
          : response.status === 429
            ? "Too many requests. Please wait before trying again."
            : response.status >= 500
              ? "The service is temporarily unavailable. Check the current status before retrying a change."
              : "The request failed. Please try again.");
    throw new ApiError(
      response.status,
      message +
        (response.status >= 500 && reference ? ` Reference: ${reference}` : ""),
      reference,
    );
  }
  return data as T;
}
export const money = (amountMinor: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amountMinor / 100,
  );
