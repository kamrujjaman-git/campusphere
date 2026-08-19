"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPlatformOwner } from "@/lib/community-validation";
import { revalidatePath } from "next/cache";
import { isValidUuid } from "@/lib/utils";

async function requireOwner() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isPlatformOwner(user.email)) {
        throw new Error("Only the platform owner can manage communities.");
    }
    return createAdminClient();
}

export async function updateCommunity(
    communityId: string,
    name: string,
    domain: string,
    key: string,
    status: "active" | "suspended"
) {
    const adminClient = await requireOwner();
    if (!isValidUuid(communityId)) {
        return { success: false, error: "Community was not found." };
    }
    if (!name.trim() || !domain.trim() || !key.trim()) {
        return { success: false, error: "Name, domain, and key are required." };
    }
    const { data, error } = await adminClient
        .from("communities")
        .update({ name: name.trim(), domain: domain.trim().toLowerCase(), key: key.trim().toLowerCase(), status })
        .eq("id", communityId)
        .select("id")
        .maybeSingle();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Community was not found." };
    revalidatePath("/owner");
    return { success: true };
}

export async function deleteCommunity(communityId: string) {
    const adminClient = await requireOwner();
    if (!isValidUuid(communityId)) {
        return { success: false, error: "Community was not found." };
    }
    const { data, error } = await adminClient
        .from("communities")
        .delete()
        .eq("id", communityId)
        .select("id")
        .maybeSingle();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Community was not found." };
    revalidatePath("/owner");
    return { success: true };
}
