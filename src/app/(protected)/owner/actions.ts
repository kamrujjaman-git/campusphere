"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPlatformOwner, normalizeEmail } from "@/lib/community-validation";
import { isValidUuid } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const LOGO_TYPES = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
]);

type AdminClient = ReturnType<typeof createAdminClient>;

async function requireOwner() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isPlatformOwner(user.email)) {
        throw new Error("Only the platform owner can manage communities.");
    }
    return { adminClient: createAdminClient(), ownerId: user.id };
}

async function findAuthUser(adminClient: AdminClient, email: string) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(`Unable to find the assigned administrator: ${error.message}`);
    return data.users.find((user) => normalizeEmail(user.email ?? "") === email) ?? null;
}

async function assignSuperAdmin(adminClient: AdminClient, communityId: string, email: string) {
    const normalizedEmail = normalizeEmail(email);
    const authUser = await findAuthUser(adminClient, normalizedEmail);

    if (!authUser) {
        const { error } = await adminClient
            .from("community_admin_invites")
            .upsert({ community_id: communityId, email: normalizedEmail, status: "pending" }, { onConflict: "community_id,email" });
        if (error) throw new Error(`Administrator invitation failed: ${error.message}`);
        return { pending: true };
    }

    const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("full_name, avatar_url, batch, phone, status")
        .eq("id", authUser.id)
        .maybeSingle();
    const { error } = await adminClient.from("profiles").upsert({
        id: authUser.id,
        full_name: existingProfile?.full_name ?? authUser.user_metadata?.full_name ?? "",
        avatar_url: existingProfile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? "",
        batch: existingProfile?.batch ?? null,
        phone: existingProfile?.phone ?? null,
        community_id: communityId,
        role: "super_admin",
        status: existingProfile?.status ?? "active",
        profile_completed: existingProfile ? undefined : false,
    });
    if (error) throw new Error(`Administrator assignment failed: ${error.message}`);
    await adminClient.from("community_admin_invites").delete().eq("email", normalizedEmail);
    return { pending: false };
}

async function uploadLogo(adminClient: AdminClient, communityId: string, entry: FormDataEntryValue | null) {
    if (!(entry instanceof File) || entry.size === 0) return null;
    if (entry.size > MAX_LOGO_SIZE) throw new Error("Community logos must be 2 MB or smaller.");
    const extension = LOGO_TYPES.get(entry.type);
    if (!extension) throw new Error("Community logo must be a JPEG, PNG, or WEBP image.");
    const path = `${communityId}/owner-logo-${crypto.randomUUID()}.${extension}`;
    const { error } = await adminClient.storage.from("branding").upload(path, entry, {
        contentType: entry.type,
        upsert: false,
    });
    if (error) throw new Error(`Community logo upload failed: ${error.message}`);
    return adminClient.storage.from("branding").getPublicUrl(path).data.publicUrl;
}

function validateCommunityInput(name: string, domain: string, adminEmail: string) {
    if (!name || !domain || !adminEmail) return "Name, domain, and super admin email are required.";
    if (!/^\S+@\S+\.\S+$/.test(adminEmail)) return "Enter a valid super admin email.";
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain)) return "Enter a valid university domain.";
    return null;
}

export async function createCommunity(formData: FormData) {
    const { adminClient, ownerId } = await requireOwner();
    const name = String(formData.get("name") ?? "").trim();
    const domain = String(formData.get("domain") ?? "").trim().toLowerCase();
    const adminEmail = normalizeEmail(String(formData.get("admin_email") ?? ""));
    const validationError = validateCommunityInput(name, domain, adminEmail);
    if (validationError) return { success: false, error: validationError };

    const prefix = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "COMMUNITY";
    const key = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: community, error } = await adminClient.from("communities").insert({
        name,
        domain,
        key,
        community_key: key,
        created_by: ownerId,
        status: "active",
    }).select("id").single();
    if (error || !community) return { success: false, error: error?.message ?? "Community creation failed." };

    try {
        const logoUrl = await uploadLogo(adminClient, community.id, formData.get("logo"));
        if (logoUrl) {
            const { error: logoError } = await adminClient.from("communities").update({ logo_url: logoUrl }).eq("id", community.id);
            if (logoError) throw new Error(`Community logo update failed: ${logoError.message}`);
        }
        await assignSuperAdmin(adminClient, community.id, adminEmail);
    } catch (assignmentError) {
        await adminClient.from("communities").delete().eq("id", community.id);
        return { success: false, error: assignmentError instanceof Error ? assignmentError.message : "Community setup failed." };
    }

    revalidatePath("/owner");
    return { success: true };
}

export async function updateCommunity(formData: FormData) {
    const { adminClient } = await requireOwner();
    const communityId = String(formData.get("community_id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const domain = String(formData.get("domain") ?? "").trim().toLowerCase();
    const key = String(formData.get("key") ?? "").trim().toLowerCase();
    const adminEmail = normalizeEmail(String(formData.get("admin_email") ?? ""));
    const status = String(formData.get("status") ?? "active");
    if (!isValidUuid(communityId)) return { success: false, error: "Community was not found." };
    const validationError = validateCommunityInput(name, domain, adminEmail);
    if (validationError || !key || !["active", "suspended"].includes(status)) return { success: false, error: validationError ?? "Community fields are invalid." };

    const { data, error } = await adminClient.from("communities").update({ name, domain, key, status }).eq("id", communityId).select("id").maybeSingle();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Community was not found." };

    try {
        const logoUrl = await uploadLogo(adminClient, communityId, formData.get("logo"));
        if (logoUrl) {
            const { error: logoError } = await adminClient.from("communities").update({ logo_url: logoUrl }).eq("id", communityId);
            if (logoError) throw new Error(`Community logo update failed: ${logoError.message}`);
        }
        const { data: previousAdmins } = await adminClient.from("profiles").select("id").eq("community_id", communityId).eq("role", "super_admin");
        if (previousAdmins?.length) await adminClient.from("profiles").update({ role: "admin" }).in("id", previousAdmins.map((profile) => profile.id));
        await assignSuperAdmin(adminClient, communityId, adminEmail);
    } catch (assignmentError) {
        return { success: false, error: assignmentError instanceof Error ? assignmentError.message : "Administrator reassignment failed." };
    }

    revalidatePath("/owner");
    return { success: true };
}

export async function deleteCommunity(communityId: string) {
    const { adminClient } = await requireOwner();
    if (!isValidUuid(communityId)) return { success: false, error: "Community was not found." };
    const { data, error } = await adminClient.from("communities").delete().eq("id", communityId).select("id").maybeSingle();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Community was not found." };
    revalidatePath("/owner");
    return { success: true };
}
