"use client";
import { useEffect, useState } from "react";
export function NetworkNotice() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online ? null : (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
    >
      You’re offline. Reconnect before making changes. Check your bookings when
      you return; an interrupted request may already have been saved.
    </div>
  );
}
