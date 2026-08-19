import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformOwner } from "@/lib/community-validation";
import { OwnerCommunityList } from "@/components/owner/owner-community-list";

export default async function OwnerPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isPlatformOwner(user.email)) redirect("/dashboard");

    const adminClient = createAdminClient();
    const { data: communities, error } = await adminClient
        .from("communities")
        .select("id, name, domain, key, created_at, status")
        .order("created_at", { ascending: false });
    if (error) throw new Error(`Unable to load communities: ${error.message}`);

    const { data: adminProfiles } = await adminClient
        .from("profiles")
        .select("id, community_id")
        .eq("role", "super_admin");
    const { data: authUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authEmailById = new Map((authUsers?.users ?? []).map((authUser) => [authUser.id, authUser.email ?? ""]));
    const adminEmailByCommunity = new Map(
        (adminProfiles ?? []).map((profile) => [profile.community_id, authEmailById.get(profile.id) ?? ""]),
    );

    const withStats = await Promise.all(
        (communities ?? []).map(async (community) => {
            const { count } = await adminClient
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("community_id", community.id);
            const { data: pendingInvite } = await adminClient
                .from("community_admin_invites")
                .select("email")
                .eq("community_id", community.id)
                .eq("status", "pending")
                .maybeSingle();
            return {
                ...community,
                totalMembers: count ?? 0,
                assignedAdminEmail: adminEmailByCommunity.get(community.id) ?? pendingInvite?.email ?? "",
            };
        })
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Global Owner Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground">All registered communities and tenancy controls.</p>
            </div>
            <OwnerCommunityList communities={withStats} />
        </div>
    );
}
