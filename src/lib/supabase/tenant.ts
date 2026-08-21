import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isPlatformOwner } from "@/lib/community-validation";

export type TenantContext = {
    user: User;
    communityId: string | null;
    isOwner: boolean;
};

export async function getTenantContext(
    supabase: SupabaseClient
): Promise<TenantContext | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("community_id")
        .eq("id", user.id)
        .maybeSingle();
    const communityId = profile?.community_id ?? null;

    if (isPlatformOwner(user.email)) {
        return {
            user,
            communityId,
            isOwner: true,
        };
    }

    if (!communityId) {
        throw new Error("Unauthorized: Missing Community Scope");
    }

    return {
        user,
        communityId,
        isOwner: false,
    };
}

export function scopeToCommunity<T>(
    query: T,
    context: TenantContext,
    column = "community_id"
): T {
    if (!context.communityId) {
        return query;
    }
    return (query as { eq: (field: string, value: string) => T }).eq(
        column,
        context.communityId
    );
}
