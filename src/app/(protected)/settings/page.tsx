import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/settings/profile-edit-form";
import { AdminSettingsPanel } from "@/components/settings/admin-settings-panel";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { CommunityInviteSettings } from "@/components/settings/community-invite-settings";
import { CommunityBrandingSettings } from "@/components/settings/community-branding-settings";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profileResult = await supabase
    .from("profiles")
    .select("full_name, batch, phone, role, avatar_url, community_id")
    .eq("id", user.id)
    .single();

  const profile = profileResult.data;

  const settingsResult = profile?.community_id
    ? await supabase
      .from("app_settings")
      .select("weekly_contribution_amount")
      .eq("community_id", profile.community_id)
      .maybeSingle()
    : { data: null };

  const isAdmin = profile?.role === "super_admin";

  const appSettings = settingsResult.data;

  const { data: community } = profile?.community_id
    ? await supabase
      .from("communities")
      .select("key, community_key, domain, name, logo_url, favicon_url")
      .eq("id", profile.community_id)
      .maybeSingle()
    : { data: null };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and preferences.
        </p>
      </div>

      <ProfileEditForm
        fullName={profile?.full_name ?? ""}
        batch={profile?.batch ?? ""}
        phone={profile?.phone ?? ""}
      />

      <div className="rounded-xl border border-border bg-card p-4">
        <AvatarUpload avatarUrl={profile?.avatar_url ?? null} />
      </div>

      {isAdmin && (
        <AdminSettingsPanel
          currentAmount={appSettings?.weekly_contribution_amount ?? 50}
        />
      )}

      {isAdmin && community && (
        <CommunityBrandingSettings
          communityName={community.name}
          logoUrl={community.logo_url}
          faviconUrl={community.favicon_url}
        />
      )}

      {isAdmin && community && (
        <CommunityInviteSettings
          communityDomain={community.domain}
          communityKey={community.key ?? community.community_key}
        />
      )}
    </div>
  );
}
