"use client";

import { useState, useTransition } from "react";
import { updateMemberRoleStatus } from "@/app/(protected)/members/actions";
import type { UserRole, UserStatus } from "@/types/profile";

export function MemberRoleControl({
  memberId,
  currentRole,
  currentStatus,
}: {
  memberId: string;
  currentRole: UserRole;
  currentStatus: UserStatus;
}) {
  const [role, setRole] = useState(currentRole);
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateMemberRoleStatus(memberId, role, status);
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? null);
      }
    });
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <h2 className="text-sm font-semibold mb-3">Admin Controls</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="member">Member</option>
            <option value="treasurer">Treasurer</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {saved && (
        <p className="text-xs text-primary mt-2">Changes saved successfully.</p>
      )}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
