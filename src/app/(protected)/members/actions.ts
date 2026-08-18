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

  const { error } = await supabase
    .from("profiles")
    .update({ role, status })
    .eq("id", memberId);

  if (error) throw new Error(error.message);

  revalidatePath(`/members/${memberId}`);
  revalidatePath("/members");
}
