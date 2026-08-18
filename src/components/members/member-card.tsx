import Link from "next/link";
import type { Profile } from "@/types/profile";
import { AvatarDisplay } from "@/components/members/avatar-display";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  treasurer: "Treasurer",
  member: "Member",
};

export function MemberCard({ profile }: { profile: Profile }) {
  return (
    <Link
      href={`/members/${profile.id}`}
      className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
    >
      <div className="relative">
        <AvatarDisplay name={profile.full_name} avatarUrl={profile.avatar_url} size="card" />
        {profile.status === "inactive" && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-muted-foreground border-2 border-card" />
        )}
      </div>

      <div className="text-center">
        <p className="font-semibold text-sm">
          {profile.full_name || "Unnamed"}
        </p>
        {profile.batch && (
          <p className="text-xs text-muted-foreground">{profile.batch}</p>
        )}
      </div>

      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${profile.role === "super_admin"
          ? "bg-primary/15 text-primary"
          : profile.role === "treasurer"
            ? "bg-blue-500/15 text-blue-400"
            : "bg-secondary text-muted-foreground"
          }`}
      >
        {roleLabels[profile.role]}
      </span>
    </Link>
  );
}
