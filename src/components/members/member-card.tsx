import Link from "next/link";
import type { Profile } from "@/types/profile";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  treasurer: "Treasurer",
  member: "Member",
};

export function MemberCard({ profile }: { profile: Profile }) {
  const initial = profile.full_name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <Link
      href={`/members/${profile.id}`}
      className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {initial}
        </div>
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
