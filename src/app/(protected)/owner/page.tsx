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

    const withStats = await Promise.all(
        (communities ?? []).map(async (community) => {
            const { count } = await adminClient
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("community_id", community.id);
            return { ...community, totalMembers: count ?? 0 };
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
