"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/supabase/tenant";

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

  if (
    profile?.role !== "super_admin" &&
    profile?.role !== "admin" &&
    profile?.role !== "treasurer"
  ) {
    throw new Error("Only super admins, admins, and treasurers can manage announcements.");
  }

  return { supabase, userId: user.id, tenant: await getTenantContext(supabase) };
}

export async function createAnnouncement(formData: FormData) {
  const { supabase, userId, tenant } = await requireAdmin();

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  if (!title || !body) {
    throw new Error("Title and message are required.");
  }

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    created_by: userId,
    community_id: tenant?.communityId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/announcements");
}

export async function deleteAnnouncement(id: string) {
  const { supabase, tenant } = await requireAdmin();

  let query = supabase
    .from("announcements")
    .delete()
    .eq("id", id);
  if (tenant?.communityId && !tenant.isOwner) query = query.eq("community_id", tenant.communityId);
  const { error } = await query;

  if (error) throw new Error(error.message);

  revalidatePath("/announcements");
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const { supabase, tenant } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    throw new Error("Title and message are required.");
  }

  let query = supabase
    .from("announcements")
    .update({ title, body })
    .eq("id", id);
  if (tenant?.communityId && !tenant.isOwner) query = query.eq("community_id", tenant.communityId);
  const { data, error } = await query.select("id").maybeSingle();

  if (error) throw new Error(`Announcement update failed: ${error.message}`);
  if (!data) throw new Error("Announcement was not found or could not be updated.");

  revalidatePath("/announcements");
}
