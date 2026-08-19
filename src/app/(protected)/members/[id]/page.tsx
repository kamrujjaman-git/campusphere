import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MemberRoleControl } from "@/components/members/member-role-control";
import { DeleteMemberButton } from "@/components/members/delete-member-button";
import { AvatarDisplay } from "@/components/members/avatar-display";
import { RoleBadge } from "@/components/members/role-badge";
import { getTenantContext } from "@/lib/supabase/tenant";
import { isValidUuid } from "@/lib/utils";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidUuid(id)) notFound();
  const supabase = await createClient();
  const tenant = await getTenantContext(supabase);
  if (!tenant) return null;

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser?.id)
    .single();

  const canManage =
    currentProfile?.role === "super_admin" || currentProfile?.role === "admin";

  let profileQuery = supabase
    .from("profiles")
    .select("*")
    .eq("id", id);
  if (tenant.communityId && !tenant.isOwner) profileQuery = profileQuery.eq("community_id", tenant.communityId);
  const { data: profile } = await profileQuery.single();

  if (!profile) notFound();

  const canViewFinancials =
    currentUser?.id === id ||
    currentProfile?.role === "super_admin" ||
    currentProfile?.role === "admin" ||
    currentProfile?.role === "treasurer";

  const { data: contributions } = canViewFinancials
    ? await (tenant.isOwner || !tenant.communityId
      ? supabase
        .from("contributions")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(10)
      : supabase
        .from("contributions")
        .select("*")
        .eq("user_id", id)
        .eq("community_id", tenant.communityId)
        .order("created_at", { ascending: false })
        .limit(10))
    : { data: null };

  const totalPaid =
    contributions
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

  const totalDue =
    contributions
      ?.filter((c) => c.status === "due")
      .reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <AvatarDisplay name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              <RoleBadge role={profile.role} />
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${profile.status === "active"
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

      {canViewFinancials && <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
          <p className="text-xl font-bold text-primary">৳{totalPaid}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Due</p>
          <p className="text-xl font-bold text-destructive">৳{totalDue}</p>
        </div>
      </div>}

      {profile.phone && (
        <div className="mb-8 p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Phone</p>
          <p className="text-sm font-medium">{profile.phone}</p>
        </div>
      )}

      {canViewFinancials && <div className="mb-8">
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
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === "paid"
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
      </div>}

      {canManage && (
        <div className="space-y-4">
          <MemberRoleControl
            memberId={profile.id}
            currentRole={profile.role}
            currentStatus={profile.status}
            requesterRole={currentProfile.role}
          />
          <DeleteMemberButton
            memberId={profile.id}
            targetRole={profile.role}
            requesterRole={currentProfile.role}
          />
        </div>
      )}
    </div>
  );
}
