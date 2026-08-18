import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TotalFundCard } from "@/components/dashboard/total-fund-card";
import { MyStatusCard } from "@/components/dashboard/my-status-card";
import { QuickStatCard } from "@/components/dashboard/quick-stat-card";
import { Users, CalendarDays, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Total Fund = all paid contributions minus all expenses — visible to everyone.
  const { data: paidContributions } = await supabase
    .from("contributions")
    .select("amount")
    .eq("status", "paid");

  const { data: expenses } = await supabase.from("expenses").select("amount");

  const totalCollected =
    paidContributions?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;
  const totalExpense =
    expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const totalFund = totalCollected - totalExpense;

  // My own due/paid.
  const { data: myContributions } = await supabase
    .from("contributions")
    .select("amount, status")
    .eq("user_id", user.id);

  const myPaid =
    myContributions
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;
  const myDue =
    myContributions
      ?.filter((c) => c.status === "due")
      .reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

  // Quick stats.
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: upcomingEventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "upcoming");

  const { count: dueMembersCount } = await supabase
    .from("contributions")
    .select("*", { count: "exact", head: true })
    .eq("status", "due");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {profile?.full_name?.split(" ")[0] || "Member"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening in PLAYBOYZ.
        </p>
      </div>

      <TotalFundCard amount={totalFund} />

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Your Contribution Status
        </h2>
        <MyStatusCard myDue={myDue} myPaid={myPaid} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Community Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickStatCard
            label="Active Members"
            value={memberCount ?? 0}
            icon={Users}
          />
          <QuickStatCard
            label="Upcoming Events"
            value={upcomingEventsCount ?? 0}
            icon={CalendarDays}
          />
          <QuickStatCard
            label="Pending Dues"
            value={dueMembersCount ?? 0}
            icon={AlertCircle}
          />
        </div>
      </div>
    </div>
  );
}
