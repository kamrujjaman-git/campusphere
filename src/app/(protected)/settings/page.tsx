import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/settings/profile-edit-form";
import { AdminSettingsPanel } from "@/components/settings/admin-settings-panel";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, settingsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, batch, phone, role").eq("id", user.id).single(),
    supabase.from("app_settings").select("weekly_contribution_amount").eq("id", 1).single(),
  ]);

  const profile = profileResult.data;

  const isAdmin = profile?.role === "super_admin";

  const appSettings = settingsResult.data;

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

      {isAdmin && (
        <AdminSettingsPanel
          currentAmount={appSettings?.weekly_contribution_amount ?? 50}
        />
      )}
    </div>
  );
}
