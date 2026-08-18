import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Wallet } from "lucide-react";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
import { EventAdminControls } from "@/components/events/event-admin-controls";
import { EditEventForm } from "@/components/events/edit-event-form";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import type { RsvpStatus } from "@/types/event";
import { getTenantContext } from "@/lib/supabase/tenant";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const tenant = await getTenantContext(supabase);
  if (!tenant) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, eventResult] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user?.id).single(),
    tenant.isOwner || !tenant.communityId
      ? supabase.from("events").select("*").eq("id", id).single()
      : supabase.from("events").select("*").eq("id", id).eq("community_id", tenant.communityId).single(),
  ]);

  const myProfile = profileResult.data;

  const canManage =
    myProfile?.role === "super_admin" || myProfile?.role === "admin";

  const event = eventResult.data;

  if (!event) notFound();

  const [myRsvpResult, participantsResult] = await Promise.all([
    supabase.from("event_participants").select("rsvp_status").eq("event_id", id).eq("user_id", user?.id).maybeSingle(),
    supabase.from("event_participants").select("user_id, rsvp_status").eq("event_id", id).eq("rsvp_status", "going"),
  ]);

  const myRsvp = myRsvpResult.data;
  const participants = participantsResult.data;

  let goingNames: string[] = [];
  if (participants && participants.length > 0) {
    const userIds = participants.map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    goingNames = (profiles ?? []).map((p) => p.full_name ?? "Unknown");
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
          {event.type}
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary capitalize">
          {event.status}
        </span>
      </div>

      <h1 className="text-2xl font-bold mb-3">{event.title}</h1>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
        {event.event_date && (
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} />
            {event.event_date}
          </div>
        )}
        {event.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} />
            {event.venue}
          </div>
        )}
        {event.budget > 0 && (
          <div className="flex items-center gap-1.5">
            <Wallet size={14} />
            Budget: ৳{event.budget}
          </div>
        )}
      </div>

      {event.description && (
        <p className="text-sm text-muted-foreground mb-6">
          {event.description}
        </p>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Your RSVP
        </h2>
        <RsvpButtons
          eventId={event.id}
          currentStatus={(myRsvp?.rsvp_status as RsvpStatus) ?? "pending"}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Going ({goingNames.length})
        </h2>
        {goingNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {goingNames.map((name, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No one has RSVP&apos;d yet.
          </p>
        )}
      </div>

      {canManage && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <EditEventForm event={event} />
            <DeleteEventButton eventId={event.id} />
          </div>
          <EventAdminControls
            eventId={event.id}
            currentStatus={event.status}
            extraContributionAmount={event.extra_contribution_amount}
          />
        </div>
      )}
    </div>
  );
}
