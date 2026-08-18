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

  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    throw new Error("Only super admins and admins can manage events.");
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

export async function updateEvent(eventId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "") as EventType;
  const description = String(formData.get("description") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "");
  const venue = String(formData.get("venue") ?? "").trim();
  const budget = Number(formData.get("budget"));
  const extraContribution = Number(formData.get("extra_contribution_amount"));
  const validStatuses = ["sports", "tour"];

  if (!title || !validStatuses.includes(type)) {
    throw new Error("Event title and type are required.");
  }
  if (!Number.isFinite(budget) || budget < 0 || !Number.isFinite(extraContribution) || extraContribution < 0) {
    throw new Error("Budget values must be valid non-negative numbers.");
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      title,
      type,
      description: description || null,
      event_date: eventDate || null,
      venue: venue || null,
      budget,
      extra_contribution_amount: extraContribution,
    })
    .eq("id", eventId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Event update failed: ${error.message}`);
  if (!data) throw new Error("Event was not found or could not be updated.");

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const { supabase } = await requireAdmin();

  const { error: participantError } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId);
  if (participantError) throw new Error(`Event RSVP cleanup failed: ${participantError.message}`);

  const { error: contributionError } = await supabase
    .from("contributions")
    .delete()
    .eq("event_id", eventId);
  if (contributionError) throw new Error(`Event contribution cleanup failed: ${contributionError.message}`);

  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Event deletion failed: ${error.message}`);
  if (!data) throw new Error("Event was not found or could not be deleted.");

  revalidatePath("/events");
  revalidatePath("/finance");
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

  if (!["going", "not_going", "pending"].includes(status)) {
    throw new Error("Invalid RSVP status.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (profile?.status !== "active") {
    throw new Error("Only active members can RSVP to events.");
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .single();

  if (!event) throw new Error("Event not found.");

  const { error } = await supabase.from("event_participants").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      rsvp_status: status,
    },
    { onConflict: "event_id,user_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/events");
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
