"use client";

import { useState, useTransition } from "react";
import {
  markContributionPaid,
  markContributionDue,
  deleteContribution,
} from "@/app/(protected)/finance/actions";
import { EditContributionForm } from "@/components/finance/edit-contribution-form";
import { Trash2 } from "lucide-react";
import type { Contribution } from "@/types/contribution";

export function ContributionRow({
  contribution,
  canManage,
}: {
  contribution: Contribution;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (contribution.status === "due") {
          await markContributionPaid(contribution.id);
        } else {
          await markContributionDue(contribution.id);
        }
      } catch (toggleError) {
        setError(toggleError instanceof Error ? toggleError.message : "Unable to update contribution.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this contribution?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteContribution(contribution.id);
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Unable to delete contribution.");
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
      <div>
        <p className="text-sm font-medium">
          {contribution.profiles?.full_name || "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {contribution.type} · ৳{contribution.amount}
          {contribution.week_start_date &&
            ` · Week of ${contribution.week_start_date}`}
        </p>
      </div>

      {canManage ? (
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            disabled={isPending}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${contribution.status === "paid"
                ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                : "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25"
              }`}
          >
            {isPending ? "..." : contribution.status === "paid" ? "Paid ✓" : "Mark Paid"}
          </button>
          <EditContributionForm contribution={contribution} />
          <button onClick={handleDelete} disabled={isPending} aria-label="Delete contribution" title="Delete contribution" className="text-muted-foreground hover:text-destructive disabled:opacity-50">
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <span
          className={`text-xs font-medium px-3 py-1.5 rounded-full ${contribution.status === "paid"
              ? "bg-green-500/15 text-green-400"
              : "bg-yellow-500/15 text-yellow-400"
            }`}
        >
          {contribution.status === "paid" ? "Paid" : "Due"}
        </span>
      )}
      {error && <p className="absolute" role="alert">{error}</p>}
    </div>
  );
}
