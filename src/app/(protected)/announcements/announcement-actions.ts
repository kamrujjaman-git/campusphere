"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  return { supabase, userId: user.id };
}

export async function createAnnouncement(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  if (!title || !body) {
    throw new Error("Title and message are required.");
  }

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/announcements");
}

export async function deleteAnnouncement(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/announcements");
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    throw new Error("Title and message are required.");
  }

  const { data, error } = await supabase
    .from("announcements")
    .update({ title, body })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Announcement update failed: ${error.message}`);
  if (!data) throw new Error("Announcement was not found or could not be updated.");

  revalidatePath("/announcements");
}
