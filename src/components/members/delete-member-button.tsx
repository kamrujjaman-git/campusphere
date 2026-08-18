"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMember } from "@/app/(protected)/members/actions";
import type { UserRole } from "@/types/profile";
import { Trash2 } from "lucide-react";

export function DeleteMemberButton({
    memberId,
    targetRole,
    requesterRole,
}: {
    memberId: string;
    targetRole: UserRole;
    requesterRole: UserRole;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const canDelete = requesterRole === "super_admin" || targetRole !== "super_admin";
    if (!canDelete) return null;

    const handleDelete = () => {
        if (!window.confirm("Delete this member and their Auth account? This cannot be undone.")) {
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await deleteMember(memberId);
            if (result.success) {
                router.push("/members");
                router.refresh();
            } else {
                setError(result.error);
            }
        });
    };

    return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <h2 className="text-sm font-semibold">Danger Zone</h2>
            <p className="mt-1 text-xs text-muted-foreground">
                Permanently remove this member and their sign-in account.
            </p>
            <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
                <Trash2 size={15} aria-hidden="true" />
                {isPending ? "Deleting..." : "Delete Member"}
            </button>
            {error && <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>}
        </div>
    );
}
