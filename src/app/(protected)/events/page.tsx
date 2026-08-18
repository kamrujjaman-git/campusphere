import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/events/event-card";
import { AddEventForm } from "@/components/events/add-event-form";
import type { Event } from "@/types/event";
import { getTenantContext } from "@/lib/supabase/tenant";

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenant = await getTenantContext(supabase);
  if (!tenant) return null;
  const communityFilter = <T,>(query: T): T => tenant.isOwner || !tenant.communityId ? query : (query as { eq: (field: string, value: string) => T }).eq("community_id", tenant.communityId);

  const [profileResult, eventsResult] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user?.id).single(),
    communityFilter(supabase.from("events").select("*").order("event_date", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false })),
  ]);

  const myProfile = profileResult.data;

  const canManage =
    myProfile?.role === "super_admin" || myProfile?.role === "admin";

  const events = eventsResult.data;

  // Get "going" counts per event.
  const eventIds = (events ?? []).map((e) => e.id);
  let goingCounts: Record<string, number> = {};

  if (eventIds.length > 0) {
    const { data: participants } = await communityFilter(supabase
      .from("event_participants")
      .select("event_id, rsvp_status")
      .in("event_id", eventIds)
      .eq("rsvp_status", "going"));

    goingCounts = (participants ?? []).reduce((acc, p) => {
      acc[p.event_id] = (acc[p.event_id] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  const eventsWithCounts: Event[] = (events ?? []).map((e) => ({
    ...e,
    going_count: goingCounts[e.id] ?? 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Events & Tours</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sports matches, tours, and community gatherings.
          </p>
        </div>
        {canManage && <AddEventForm />}
      </div>

      {eventsWithCounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No events yet.
          {canManage && ' Click "New Event" to create one.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventsWithCounts.map((event) => (
            <EventCard key={event.id} event={event} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}
