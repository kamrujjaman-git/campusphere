import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { Event } from "@/types/event";

const statusStyles: Record<string, string> = {
  upcoming: "bg-primary/15 text-primary",
  ongoing: "bg-blue-500/15 text-blue-400",
  completed: "bg-secondary text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

export function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
          {event.type}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            statusStyles[event.status]
          }`}
        >
          {event.status}
        </span>
      </div>

      <h3 className="font-semibold text-base mb-2">{event.title}</h3>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {event.event_date && (
          <div className="flex items-center gap-1.5">
            <CalendarDays size={12} />
            {event.event_date}
          </div>
        )}
        {event.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} />
            {event.venue}
          </div>
        )}
        {typeof event.going_count === "number" && (
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            {event.going_count} going
          </div>
        )}
      </div>
    </Link>
  );
}
