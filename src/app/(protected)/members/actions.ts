"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { UserRole, UserStatus } from "@/types/profile";
import { isPlatformOwner, validateUniversityEmail } from "@/lib/community-validation";

const validRoles = new Set<UserRole>([
  "super_admin",
  "admin",
  "treasurer",
  "member",
]);
const validStatuses = new Set<UserStatus>(["active", "inactive"]);

type ActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireMemberManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: requesterProfile, error } = await supabase
    .from("profiles")
    .select("role, community_id")
    .eq("id", user.id)
    .single();

  if (error || !requesterProfile) {
    throw new Error("Unable to verify your member-management permissions.");
  }

  if (
    requesterProfile.role !== "super_admin" &&
    requesterProfile.role !== "admin"
  ) {
    throw new Error("Only super admins and admins can manage members.");
  }

  if (!isPlatformOwner(user.email) && !requesterProfile.community_id) {
    throw new Error("Unauthorized: Missing Community Scope");
  }

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    requesterRole: requesterProfile.role as UserRole,
    communityId: requesterProfile.community_id as string | null,
  };
}

function canManageTarget(
  requesterRole: UserRole,
  targetRole: UserRole,
  nextRole?: UserRole
) {
  if (requesterRole === "super_admin") return true;
  return targetRole !== "super_admin" && nextRole !== "super_admin";
}

export async function updateMemberRoleStatus(
  memberId: string,
  role: UserRole,
  status: UserStatus
): Promise<ActionResult> {
  const { userId, userEmail, requesterRole, communityId } = await requireMemberManager();
  const scope = <T,>(query: T): T => isPlatformOwner(userEmail) ? query : (query as { eq: (field: string, value: string) => T }).eq("community_id", communityId!);

  if (!validRoles.has(role) || !validStatuses.has(status)) {
    return { success: false, error: "Invalid member role or status." };
  }

  const adminClient = createAdminClient();
  const { data: targetProfile, error: targetError } = await scope(adminClient
    .from("profiles")
    .select("role")
    .eq("id", memberId)
    .maybeSingle());

  if (targetError || !targetProfile) {
    return { success: false, error: "Member profile was not found." };
  }

  if (!canManageTarget(requesterRole, targetProfile.role, role)) {
    return {
      success: false,
      error: "Admins cannot modify or promote super admin profiles.",
    };
  }

  if (memberId === userId && (role !== "super_admin" || status === "inactive")) {
    return {
      success: false,
      error: "You cannot demote or deactivate your own super admin account.",
    };
  }

  const { data: updatedProfile, error } = await scope(adminClient
    .from("profiles")
    .update({ role, status })
    .eq("id", memberId)
    .select("id")
    .maybeSingle());

  if (error || !updatedProfile) {
    return {
      success: false,
      error: `Failed to update profile. ${error?.message ?? "No profile was updated."}`,
    };
  }

  revalidatePath("/members");
  revalidatePath("/members/[id]", "page");
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

export async function createMember(formData: FormData): Promise<ActionResult> {
  const { requesterRole, communityId, userEmail } = await requireMemberManager();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "member") as UserRole;
  const status = String(formData.get("status") ?? "active") as UserStatus;

  if (!fullName || !email) {
    return { success: false, error: "Name and email are required." };
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  if (!validRoles.has(role) || !validStatuses.has(status)) {
    return { success: false, error: "Invalid member role or status." };
  }

  if (requesterRole === "admin" && role === "super_admin") {
    return { success: false, error: "Admins cannot create super admin profiles." };
  }

  const ownerBypass = isPlatformOwner(userEmail);
  if (!ownerBypass) {
    if (!communityId) {
      return { success: false, error: "Your account is not linked to a community." };
    }

    const emailValidation = validateUniversityEmail(email);
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error };
    }

    const supabase = await createClient();
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("domain")
      .eq("id", communityId)
      .maybeSingle();
    if (communityError || !community) {
      return { success: false, error: "Your community could not be verified." };
    }
    if (emailValidation.domain !== String(community.domain).toLowerCase()) {
      return { success: false, error: "Member email must match your community's university domain." };
    }
  }

  const adminClient = createAdminClient();
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error: `Failed to create Auth user. ${authError?.message ?? "No user was created."}`,
    };
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName,
    phone: phone || null,
    community_id: communityId,
    role,
    status,
    profile_completed: true,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return {
      success: false,
      error: `Member profile creation failed. ${profileError.message}`,
    };
  }

  revalidatePath("/members");
  return { success: true };
}

export async function deleteMember(memberId: string): Promise<ActionResult> {
  const { userId, userEmail, requesterRole, communityId } = await requireMemberManager();
  const scope = <T,>(query: T): T => isPlatformOwner(userEmail) ? query : (query as { eq: (field: string, value: string) => T }).eq("community_id", communityId!);

  if (memberId === userId) {
    return { success: false, error: "You cannot delete your own account." };
  }

  const adminClient = createAdminClient();
  const { data: targetProfile, error: targetError } = await scope(adminClient
    .from("profiles")
    .select("role")
    .eq("id", memberId)
    .maybeSingle());

  if (targetError || !targetProfile) {
    return { success: false, error: "Member profile was not found." };
  }

  if (!canManageTarget(requesterRole, targetProfile.role)) {
    return {
      success: false,
      error: "Admins cannot delete super admin profiles.",
    };
  }

  const { error: authError } = await adminClient.auth.admin.deleteUser(memberId);
  if (authError) {
    return {
      success: false,
      error: `Failed to delete Auth user. ${authError.message}`,
    };
  }

  const { error: profileError } = await scope(adminClient
    .from("profiles")
    .delete()
    .eq("id", memberId));

  if (profileError) {
    return {
      success: false,
      error: `Auth user deleted, but profile cleanup failed. ${profileError.message}`,
    };
  }

  revalidatePath("/members");
  revalidatePath("/members/[id]", "page");
  return { success: true };
}
