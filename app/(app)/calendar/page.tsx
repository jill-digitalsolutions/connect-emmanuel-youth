import { getEvents } from "@/lib/queries/events";
import { getBanners } from "@/lib/queries/banners";
import { getSessions } from "@/lib/queries/sessions";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const [events, banners, sessions] = await Promise.all([getEvents(), getBanners(), getSessions()]);
  return <CalendarClient initialEvents={events} initialBanners={banners} initialSessions={sessions} />;
}
