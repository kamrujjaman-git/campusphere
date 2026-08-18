"use client";

import { useState, useTransition } from "react";
import { updateMemberRoleStatus } from "@/app/(protected)/members/actions";
import type { UserRole, UserStatus } from "@/types/profile";
import { Dropdown } from "@/components/ui/dropdown";

export function MemberRoleControl({
  memberId,
  currentRole,
  currentStatus,
  requesterRole,
}: {
  memberId: string;
  currentRole: UserRole;
  currentStatus: UserStatus;
  requesterRole: UserRole;
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
          <Dropdown
            value={role}
            onValueChange={(value) => setRole(value as UserRole)}
            options={[{ value: "member", label: "Member" }, { value: "treasurer", label: "Treasurer" }, { value: "admin", label: "Admin" }, ...(requesterRole === "super_admin" ? [{ value: "super_admin", label: "Super Admin" }] : [])]}
            aria-label="Member role"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">
            Status
          </label>
          <Dropdown
            value={status}
            onValueChange={(value) => setStatus(value as UserStatus)}
            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
            aria-label="Member status"
          />
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
