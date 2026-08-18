"use client";

import { useState, useTransition } from "react";
import { updateWeeklyAmount } from "@/app/(protected)/settings/settings-actions";

export function AdminSettingsPanel({
  currentAmount,
}: {
  currentAmount: number;
}) {
  const [amount, setAmount] = useState(currentAmount);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateWeeklyAmount(amount);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <h2 className="text-sm font-semibold mb-1">Admin Settings</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Changes here affect the whole community.
      </p>

      <label className="text-xs text-muted-foreground block mb-1">
        Weekly Contribution Amount (৳)
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-32 px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        This only affects future weeks — already generated dues stay the same.
      </p>

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      {saved && <p className="text-xs text-primary mt-2">Amount updated.</p>}
    </div>
  );
}
