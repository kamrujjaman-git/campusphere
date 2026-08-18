import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { EditEventForm } from "@/components/events/edit-event-form";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import type { Event } from "@/types/event";

const statusStyles: Record<string, string> = {
  upcoming: "bg-primary/15 text-primary",
  ongoing: "bg-blue-500/15 text-blue-400",
  completed: "bg-secondary text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

export function EventCard({ event, canManage }: { event: Event; canManage: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Link href={`/events/${event.id}`} className="block hover:text-primary transition-colors">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
            {event.type}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusStyles[event.status]
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
      {canManage && (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <EditEventForm event={event} />
          <DeleteEventButton eventId={event.id} />
        </div>
      )}
    </div>
  );
}
