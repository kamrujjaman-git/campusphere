"use client";

import { useState, useMemo } from "react";
import { MemberSearch } from "@/components/members/member-search";
import { MemberCard } from "@/components/members/member-card";
import { CreateMemberForm } from "@/components/members/create-member-form";
import type { Profile } from "@/types/profile";
import type { UserRole } from "@/types/profile";

export function MemberDirectory({
  profiles,
  requesterRole,
}: {
  profiles: Profile[];
  requesterRole?: UserRole;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return profiles;
    const q = query.toLowerCase();
    return profiles.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.batch?.toLowerCase().includes(q)
    );
  }, [profiles, query]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <MemberSearch onSearch={setQuery} />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground hidden sm:block">
            {filtered.length} of {profiles.length} members
          </p>
          {(requesterRole === "super_admin" || requesterRole === "admin") && (
            <CreateMemberForm requesterRole={requesterRole} />
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No members found matching &quot;{query}&quot;
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((profile) => (
            <MemberCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
