"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdminOrTreasurer() {
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

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// Generates a "due" contribution row for every active member for the current week,
// skipping members who already have one for this week.
export async function generateWeeklyDues() {
  try {
    const { supabase } = await requireAdminOrTreasurer();
    const weekStart = getMonday(new Date());

    const { data: appSettings } = await supabase
      .from("app_settings")
      .select("weekly_contribution_amount")
      .eq("id", 1)
      .maybeSingle();
    const weeklyAmount = Number(appSettings?.weekly_contribution_amount) || 50;

    const { data: activeMembers, error: activeMembersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("status", "active");

    if (activeMembersError) {
      return { success: false, count: 0, error: activeMembersError.message };
    }

    if (activeMembers.length === 0) {
      return { success: true, count: 0 };
    }

    const { data: existing, error: existingError } = await supabase
      .from("contributions")
      .select("user_id")
      .eq("type", "weekly")
      .eq("week_start_date", weekStart);

    if (existingError) {
      return { success: false, count: 0, error: existingError.message };
    }

    const existingUserIds = new Set(existing.map((contribution) => contribution.user_id));
    const toCreate = activeMembers
      .filter((member) => !existingUserIds.has(member.id))
      .map((member) => ({
        user_id: member.id,
        type: "weekly" as const,
        amount: weeklyAmount,
        week_start_date: weekStart,
        status: "due" as const,
      }));

    if (toCreate.length === 0) {
      return { success: true, count: 0 };
    }

    const { error: insertError } = await supabase
      .from("contributions")
      .insert(toCreate);

    if (insertError) {
      if (insertError.code === "23505") {
        return { success: true, count: 0 };
      }

      return { success: false, count: 0, error: insertError.message };
    }

    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return { success: true, count: toCreate.length };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unable to generate weekly dues.",
    };
  }
}

export async function markContributionPaid(contributionId: string) {
  const { supabase, userId } = await requireAdminOrTreasurer();

  const { error } = await supabase
    .from("contributions")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      marked_by: userId,
    })
    .eq("id", contributionId);

  if (error) throw new Error(error.message);

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function markContributionDue(contributionId: string) {
  const { supabase } = await requireAdminOrTreasurer();

  const { error } = await supabase
    .from("contributions")
    .update({ status: "due", paid_at: null, marked_by: null })
    .eq("id", contributionId);

  if (error) throw new Error(error.message);

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

// Creates an event-based extra contribution due for all active members.
export async function createEventContribution(
  eventId: string,
  amount: number
) {
  const { supabase } = await requireAdminOrTreasurer();

  const { data: activeMembers } = await supabase
    .from("profiles")
    .select("id")
    .eq("status", "active");

  if (!activeMembers || activeMembers.length === 0) {
    return { created: 0 };
  }

  const toCreate = activeMembers.map((m) => ({
    user_id: m.id,
    type: "event" as const,
    event_id: eventId,
    amount,
    status: "due" as const,
  }));

  const { error } = await supabase.from("contributions").insert(toCreate);
  if (error) throw new Error(error.message);

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { created: toCreate.length };
}
