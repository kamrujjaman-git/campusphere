"use client";

import { useTransition } from "react";
import {
  markContributionPaid,
  markContributionDue,
} from "@/app/(protected)/finance/actions";
import type { Contribution } from "@/types/contribution";

export function ContributionRow({
  contribution,
  canManage,
}: {
  contribution: Contribution;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      if (contribution.status === "due") {
        await markContributionPaid(contribution.id);
      } else {
        await markContributionDue(contribution.id);
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
        <button
          onClick={toggle}
          disabled={isPending}
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
            contribution.status === "paid"
              ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
              : "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25"
          }`}
        >
          {isPending
            ? "..."
            : contribution.status === "paid"
            ? "Paid ✓"
            : "Mark Paid"}
        </button>
      ) : (
        <span
          className={`text-xs font-medium px-3 py-1.5 rounded-full ${
            contribution.status === "paid"
              ? "bg-green-500/15 text-green-400"
              : "bg-yellow-500/15 text-yellow-400"
          }`}
        >
          {contribution.status === "paid" ? "Paid" : "Due"}
        </span>
      )}
    </div>
  );
}
