import { createClient } from "@/lib/supabase/server";
import { MemberDirectory } from "@/components/members/member-directory";
import type { Profile } from "@/types/profile";

export default async function MembersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [currentProfileResult, profilesResult] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user?.id).maybeSingle(),
    supabase.from("profiles").select("*").order("full_name", { ascending: true }),
  ]);

  const currentProfile = currentProfileResult.data;
  const profiles = profilesResult.data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everyone in the PLAYBOYZ community.
        </p>
      </div>

      <MemberDirectory
        profiles={(profiles as Profile[]) || []}
        requesterRole={currentProfile?.role}
      />
    </div>
  );
}
