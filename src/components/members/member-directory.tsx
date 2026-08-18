"use client";

import { useState, useMemo } from "react";
import { MemberSearch } from "@/components/members/member-search";
import { MemberCard } from "@/components/members/member-card";
import type { Profile } from "@/types/profile";

export function MemberDirectory({ profiles }: { profiles: Profile[] }) {
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
      <div className="flex items-center justify-between mb-6">
        <MemberSearch onSearch={setQuery} />
        <p className="text-sm text-muted-foreground hidden sm:block">
          {filtered.length} of {profiles.length} members
        </p>
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
