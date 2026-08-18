import { createClient } from "@/lib/supabase/server";
import { AddAnnouncementForm } from "@/components/announcements/add-announcement-form";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import type { Announcement } from "@/types/announcement";
import { getTenantContext } from "@/lib/supabase/tenant";

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenant = await getTenantContext(supabase);
  if (!tenant) return null;
  const communityFilter = <T,>(query: T): T => tenant.isOwner || !tenant.communityId ? query : (query as { eq: (field: string, value: string) => T }).eq("community_id", tenant.communityId);

  const [profileResult, announcementsResult] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user?.id).single(),
    communityFilter(supabase.from("announcements").select("*").order("created_at", { ascending: false })),
  ]);

  const myProfile = profileResult.data;

  const canManage =
    myProfile?.role === "super_admin" ||
    myProfile?.role === "admin" ||
    myProfile?.role === "treasurer";

  const rawAnnouncements = announcementsResult.data;

  const authorIds = [
    ...new Set(
      (rawAnnouncements ?? [])
        .map((a) => a.created_by)
        .filter(Boolean) as string[]
    ),
  ];

  let authorsMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await communityFilter(supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds));

    authorsMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? "Unknown"])
    );
  }

  const announcements: Announcement[] = (rawAnnouncements ?? []).map((a) => ({
    ...a,
    author_name: a.created_by ? authorsMap[a.created_by] : undefined,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notices and updates for everyone.
          </p>
        </div>
        {canManage && <AddAnnouncementForm />}
      </div>

      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No announcements yet.
        </p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
