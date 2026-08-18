"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserRole, UserStatus } from "@/types/profile";

export async function updateMemberRoleStatus(
  memberId: string,
  role: UserRole,
  status: UserStatus
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (requesterProfile?.role !== "super_admin") {
    throw new Error("Only super admins can update member roles.");
  }

  if (memberId === user.id && (role !== "super_admin" || status === "inactive")) {
    return {
      success: false,
      error: "You cannot demote or deactivate your own super admin account.",
    };
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({
      role,
      status,
    })
    .eq("id", memberId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: `Failed to update profile. Please check Supabase RLS policies. ${error.message}`,
    };
  }

  if (!updatedProfile) {
    return {
      success: false,
      error: "Failed to update profile. Please check Supabase RLS policies.",
    };
  }

  revalidatePath("/members");
  revalidatePath("/members/[id]", "page");
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}
