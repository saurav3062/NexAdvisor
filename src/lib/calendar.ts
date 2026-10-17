import type { Booking } from "./nexadvisor-api";
// Use UTC instants and omit user-entered text to prevent calendar content injection.
export function calendarText(b: Booking) {
  const stamp = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NexAdvisor//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:" + b.id + "@nexadvisor",
    "DTSTAMP:" + stamp(new Date().toISOString()),
    "DTSTART:" + stamp(b.startsAt),
    "DTEND:" + stamp(b.endsAt),
    "SUMMARY:NexAdvisor consultation",
    "DESCRIPTION:Open your NexAdvisor booking for session details.",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
export function downloadCalendar(b: Booking) {
  const url = URL.createObjectURL(
    new Blob([calendarText(b)], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "nexadvisor-" + b.id + ".ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
