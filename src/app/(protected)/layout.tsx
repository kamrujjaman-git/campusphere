import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, status")
    .eq("id", user.id)
    .single();

  if (profile?.status === "inactive") {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <Header
          userName={profile?.full_name || "Member"}
          userEmail={user.email ?? ""}
        />
        <main className="p-4 md:p-8 pb-24 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}