"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png"]);

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
export async function saveAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const entry = formData.get("avatar");
  if (!(entry instanceof File)) {
    return { success: false, error: "Please choose an avatar image." };
  }
  if (!AVATAR_TYPES.has(entry.type)) {
    return { success: false, error: "Avatar must be a JPEG or PNG image." };
  }
  if (entry.size === 0 || entry.size > MAX_AVATAR_SIZE) {
    return { success: false, error: "Avatar images must be between 1 byte and 2 MB." };
  }

  const fileName = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, entry, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    return { success: false, error: `Avatar upload failed: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);
  const avatarUrl = publicUrlData.publicUrl;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (profileError) {
    await supabase.storage.from("avatars").remove([fileName]);
    return { success: false, error: `Profile update failed: ${profileError.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/members");
  revalidatePath(`/members/${user.id}`);
  return { success: true, avatarUrl };
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, community_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" || !profile.community_id) {
    throw new Error("Only super admins can change this.");
  }

  return { supabase, communityId: profile.community_id };
}

export async function updateWeeklyAmount(amount: number) {
  const { supabase, communityId } = await requireAdmin();

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const { error } = await supabase
    .from("app_settings")
    .update({ weekly_contribution_amount: amount, updated_at: new Date().toISOString() })
    .eq("community_id", communityId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

export async function updateCommunityBranding(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const faviconUrl = String(formData.get("favicon_url") ?? "").trim();

  if (!name) throw new Error("Community name is required.");

  for (const [label, value] of [["logo", logoUrl], ["favicon", faviconUrl]] as const) {
    if (value && !/^https?:\/\//i.test(value)) {
      throw new Error(`${label} URL must use http or https.`);
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("community_id")
    .eq("id", user?.id)
    .single();

  if (!profile?.community_id) throw new Error("Your profile is not linked to a community.");

  const { error } = await supabase
    .from("communities")
    .update({ name, logo_url: logoUrl || null, favicon_url: faviconUrl || null })
    .eq("id", profile.community_id);

  if (error) throw new Error(`Branding update failed: ${error.message}`);

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

