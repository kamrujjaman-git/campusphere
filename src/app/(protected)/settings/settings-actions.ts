"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMyProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const fullName = formData.get("full_name") as string;
  const batch = formData.get("batch") as string;
  const phone = formData.get("phone") as string;

  if (!fullName) throw new Error("Name is required.");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      batch: batch || null,
      phone: phone || null,
      profile_completed: true,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

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

  if (profile?.role !== "super_admin") {
    throw new Error("Only super admins can change this.");
  }

  return supabase;
}

export async function updateWeeklyAmount(amount: number) {
  const supabase = await requireAdmin();

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const { error } = await supabase
    .from("app_settings")
    .update({ weekly_contribution_amount: amount, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}
