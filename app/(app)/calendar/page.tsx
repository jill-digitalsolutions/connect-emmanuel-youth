import { getEvents } from "@/lib/queries/events";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const events = await getEvents();
  return <CalendarClient initialEvents={events} />;
}
