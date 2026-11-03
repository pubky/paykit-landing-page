import { conferenceCalendar } from "@/lib/calendar.mjs";
import { conferenceVisibleUntil, isConferenceVisible } from "@/lib/conference.mjs";

export const dynamic = "force-dynamic";

export function GET() {
  const now = Date.now();
  if (!isConferenceVisible(now)) {
    return new Response("This conference has ended.", {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const maxAge = Math.min(3600, Math.floor((Date.parse(conferenceVisibleUntil) - now) / 1000));
  return new Response(conferenceCalendar(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="paykit-planb-el-salvador-2027.ics"',
      "Cache-Control": `public, max-age=${maxAge}, must-revalidate`,
    },
  });
}
