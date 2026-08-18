"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
    MAX_ACTIVE_COMMUNITIES,
    getEmailDomain,
    isPlatformOwner,
    validateUniversityEmail,
} from "@/lib/community-validation";

export async function createCommunity(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) throw new Error("Not authenticated");

    const { count, error: countError } = await supabase
        .from("communities")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

    if (countError) {
        throw new Error(`Unable to check community limit: ${countError.message}`);
    }

    if ((count ?? 0) >= MAX_ACTIVE_COMMUNITIES) {
        return {
            success: false,
            error: "Global limit reached (10/10 communities). New creations are currently locked.",
        };
    }

    const name = String(formData.get("name") ?? "").trim();
    const key = String(formData.get("community_key") ?? "").trim().toLowerCase();
    if (!name || !key) {
        return { success: false, error: "Community name and key are required." };
    }

    const ownerBypass = isPlatformOwner(user.email);
    const emailValidation = validateUniversityEmail(user.email);
    if (!ownerBypass && !emailValidation.valid) {
        return { success: false, error: emailValidation.error };
    }

    const domain = ownerBypass ? getEmailDomain(user.email) : emailValidation.domain;
    const { data: community, error } = await supabase
        .from("communities")
        .insert({ name, key, domain, created_by: user.id, status: "active" })
        .select("id")
        .maybeSingle();

    if (error || !community) {
        throw new Error(`Community creation failed: ${error?.message ?? "No community was created."}`);
    }

    revalidatePath("/settings");
    return { success: true, communityId: community.id };
}
