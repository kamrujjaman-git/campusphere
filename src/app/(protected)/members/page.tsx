import { createClient } from "@/lib/supabase/server";
import { MemberDirectory } from "@/components/members/member-directory";
import type { Profile } from "@/types/profile";
import { getTenantContext } from "@/lib/supabase/tenant";
import { isPlatformOwner } from "@/lib/community-validation";

export default async function MembersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenant = await getTenantContext(supabase);
  if (!tenant) return null;
  const owner = isPlatformOwner(user?.email);

  const [currentProfileResult, profilesResult] = await Promise.all([
    owner ? Promise.resolve({ data: { role: "super_admin" } }) : supabase.from("profiles").select("role").eq("id", user?.id).maybeSingle(),
    tenant.isOwner || !tenant.communityId
      ? supabase.from("profiles").select("*").order("full_name", { ascending: true })
      : supabase.from("profiles").select("*").eq("community_id", tenant.communityId).order("full_name", { ascending: true }),
  ]);

  const currentProfile = currentProfileResult.data;
  const profiles = profilesResult.data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everyone in the Campusphere community.
        </p>
      </div>

      <MemberDirectory
        profiles={(profiles as Profile[]) || []}
        requesterRole={currentProfile?.role}
      />
    </div>
  );
}
