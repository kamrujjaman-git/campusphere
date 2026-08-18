import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MemberRoleControl } from "@/components/members/member-role-control";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  treasurer: "Treasurer",
  member: "Member",
};

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser?.id)
    .single();

  const isAdmin = currentProfile?.role === "super_admin";

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: contributions } = await supabase
    .from("contributions")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const totalPaid =
    contributions
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

  const totalDue =
    contributions
      ?.filter((c) => c.status === "due")
      .reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

  const initial = profile.full_name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {roleLabels[profile.role]}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                profile.status === "active"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {profile.status === "active" ? "Active" : "Inactive"}
            </span>
            {profile.batch && (
              <span className="text-xs text-muted-foreground">
                {profile.batch}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
          <p className="text-xl font-bold text-primary">৳{totalPaid}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Due</p>
          <p className="text-xl font-bold text-destructive">৳{totalDue}</p>
        </div>
      </div>

      {profile.phone && (
        <div className="mb-8 p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Phone</p>
          <p className="text-sm font-medium">{profile.phone}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Recent Contributions
        </h2>
        {contributions && contributions.length > 0 ? (
          <div className="space-y-2">
            {contributions.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border text-sm"
              >
                <span className="capitalize text-muted-foreground">
                  {c.type} contribution
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">৳{c.amount}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.status === "paid"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {c.status === "paid" ? "Paid" : "Due"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No contribution history yet.
          </p>
        )}
      </div>

      {isAdmin && (
        <MemberRoleControl
          memberId={profile.id}
          currentRole={profile.role}
          currentStatus={profile.status}
        />
      )}
    </div>
  );
}
