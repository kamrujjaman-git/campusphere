"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EventType, EventStatus, RsvpStatus } from "@/types/event";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" && profile?.role !== "treasurer") {
    throw new Error("Only admins or treasurers can do this.");
  }

  return { supabase, userId: user.id };
}

export async function createEvent(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const title = formData.get("title") as string;
  const type = formData.get("type") as EventType;
  const description = formData.get("description") as string;
  const eventDate = formData.get("event_date") as string;
  const venue = formData.get("venue") as string;
  const budget = parseFloat((formData.get("budget") as string) || "0");
  const extraContribution = parseFloat(
    (formData.get("extra_contribution_amount") as string) || "0"
  );

  if (!title || !type) {
    throw new Error("Title and type are required.");
  }

  const { error } = await supabase.from("events").insert({
    title,
    type,
    description: description || null,
    event_date: eventDate || null,
    venue: venue || null,
    budget,
    extra_contribution_amount: extraContribution,
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/events");
}

export async function updateEventStatus(eventId: string, status: EventStatus) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId);

  if (error) throw new Error(error.message);

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function setRsvp(eventId: string, status: RsvpStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("event_participants").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      rsvp_status: status,
    },
    { onConflict: "event_id,user_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}`);
}

// Generates an extra "due" contribution for this event for every active member.
export async function generateEventContributions(eventId: string) {
  const { supabase } = await requireAdmin();

  const { data: event } = await supabase
    .from("events")
    .select("extra_contribution_amount")
    .eq("id", eventId)
    .single();

  const amount = event?.extra_contribution_amount ?? 0;
  if (!amount || amount <= 0) {
    throw new Error("Set an extra contribution amount on this event first.");
  }

  const { data: activeMembers } = await supabase
    .from("profiles")
    .select("id")
    .eq("status", "active");

  if (!activeMembers || activeMembers.length === 0) {
    return { created: 0 };
  }

  const { data: existing } = await supabase
    .from("contributions")
    .select("user_id")
    .eq("type", "event")
    .eq("event_id", eventId);

  const existingUserIds = new Set(existing?.map((e) => e.user_id));
  const toCreate = activeMembers
    .filter((m) => !existingUserIds.has(m.id))
    .map((m) => ({
      user_id: m.id,
      type: "event" as const,
      event_id: eventId,
      amount,
      status: "due" as const,
    }));

  if (toCreate.length === 0) {
    return { created: 0 };
  }

  const { error } = await supabase.from("contributions").insert(toCreate);
  if (error) throw new Error(error.message);

  revalidatePath("/finance");
  revalidatePath(`/events/${eventId}`);
  return { created: toCreate.length };
}
