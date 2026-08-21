"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isPlatformOwner } from "@/lib/community-validation";
import { isValidUuid } from "@/lib/utils";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_BRANDING_SIZE = 2 * 1024 * 1024;
const BRANDING_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/x-icon", "ico"],
  ["image/vnd.microsoft.icon", "ico"],
]);

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

  const owner = isPlatformOwner(user.email);
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_url, role, status, community_id")
    .eq("id", user.id)
    .maybeSingle();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    batch: batch || null,
    phone: phone || null,
    avatar_url: currentProfile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
    community_id: currentProfile?.community_id ?? null,
    role: currentProfile?.role ?? (owner ? "super_admin" : "member"),
    status: currentProfile?.status ?? "active",
    profile_completed: true,
  });

  if (error) throw new Error(error.message);

  if (owner) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone, batch },
    });
    if (metadataError) throw new Error(metadataError.message);
  }

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

  const fileName = `${user.id}/avatar.png`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, entry, { contentType: "image/png", upsert: true });

  if (uploadError) {
    return { success: false, error: `Avatar upload failed: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);
  const avatarUrl = publicUrlData.publicUrl;

  const owner = isPlatformOwner(user.email);
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("full_name, phone, batch, role, status, community_id")
    .eq("id", user.id)
    .maybeSingle();
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    avatar_url: avatarUrl,
    full_name: currentProfile?.full_name ?? user.user_metadata?.full_name ?? "",
    phone: currentProfile?.phone ?? user.user_metadata?.phone ?? null,
    batch: currentProfile?.batch ?? user.user_metadata?.batch ?? null,
    role: currentProfile?.role ?? (owner ? "super_admin" : "member"),
    status: currentProfile?.status ?? "active",
    community_id: currentProfile?.community_id ?? null,
    profile_completed: true,
  });

  if (profileError) {
    await supabase.storage.from("avatars").remove([fileName]);
    return { success: false, error: `Profile update failed: ${profileError.message}` };
  }

  if (owner) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    });
    if (metadataError) {
      return { success: false, error: `Profile metadata update failed: ${metadataError.message}` };
    }
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

  const owner = isPlatformOwner(user.email);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, community_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!owner && (profile?.role !== "super_admin" || !profile.community_id)) {
    throw new Error("Only super admins can change this.");
  }

  return { supabase, communityId: profile?.community_id ?? null, isOwner: owner };
}

export async function updateWeeklyAmount(amount: number) {
  const { supabase, communityId, isOwner } = await requireAdmin();

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  let query = supabase
    .from("app_settings")
    .update({ weekly_contribution_amount: amount, updated_at: new Date().toISOString() });
  if (communityId) query = query.eq("community_id", communityId);
  else if (!isOwner) throw new Error("Your profile is not linked to a community.");
  const { error } = await query;

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

export async function updateCommunityBranding(formData: FormData): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { supabase, communityId: profileCommunityId, isOwner } = await requireAdmin();
    const requestedCommunityId = String(formData.get("community_id") ?? "").trim();
    const communityId = isOwner ? requestedCommunityId || profileCommunityId : profileCommunityId;
    if (!communityId || !isValidUuid(communityId)) {
      return { success: false, error: "A valid community is required." };
    }

    const name = String(formData.get("name") ?? "").trim();
    const logoEntry = formData.get("logo");
    const faviconEntry = formData.get("favicon");
    const logoFile = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null;
    const faviconFile = faviconEntry instanceof File && faviconEntry.size > 0 ? faviconEntry : null;

    if (!name) {
      return { success: false, error: "Community name is required." };
    }

    for (const [label, file] of [["logo", logoFile], ["favicon", faviconFile]] as const) {
      if (!file) continue;
      if (file.size > MAX_BRANDING_SIZE) {
        return { success: false, error: `${label} images must be 2 MB or smaller.` };
      }
      if (!BRANDING_TYPES.has(file.type)) {
        return { success: false, error: `${label} must be a JPEG, PNG, WEBP, or ICO image.` };
      }
    }

    const { data: currentCommunity, error: communityLookupError } = await supabase
      .from("communities")
      .select("logo_url, favicon_url")
      .eq("id", communityId)
      .single();
    if (communityLookupError || !currentCommunity) {
      return { success: false, error: "Your community could not be verified." };
    }

    const uploadedPaths: string[] = [];
    const uploadBrandingFile = async (file: File, label: string) => {
      const extension = BRANDING_TYPES.get(file.type);
      if (!extension) {
        throw new Error(`${label} has an unsupported image type.`);
      }

      const path = `${communityId}/${label}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        throw new Error(`${label} upload failed: ${uploadError.message}`);
      }

      uploadedPaths.push(path);

      const { data: publicUrlData } = supabase.storage.from("branding").getPublicUrl(path);
      if (!publicUrlData?.publicUrl) {
        throw new Error(`${label} URL generation failed: No public URL was returned.`);
      }

      return publicUrlData.publicUrl;
    };

    let logoUrl = currentCommunity.logo_url;
    let faviconUrl = currentCommunity.favicon_url;

    try {
      if (logoFile) logoUrl = await uploadBrandingFile(logoFile, "logo");
      if (faviconFile) faviconUrl = await uploadBrandingFile(faviconFile, "favicon");

      const { error } = await supabase
        .from("communities")
        .update({ name, logo_url: logoUrl, favicon_url: faviconUrl })
        .eq("id", communityId);

      if (error) {
        throw new Error(`Branding update failed: ${error.message}`);
      }
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("branding").remove(uploadedPaths);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to update branding.",
      };
    }

    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/owner");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update branding.",
    };
  }
}

